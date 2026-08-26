const { Topic, FlashcardDeck, Quiz, StudyPlan } = require('../models');
const { Op } = require('sequelize');
const { sequelize: db } = require('../config/db');

// @desc    Global search across topics, decks, quizzes, and study plan tasks
// @route   GET /api/search
// @access  Private
exports.globalSearch = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) {
      return res.status(200).json({
        success: true,
        data: {
          topics: [],
          decks: [],
          quizzes: [],
          tasks: [],
        },
      });
    }

    const userId = req.user.id;
    const queryLike = `%${q}%`;

    // 1. Search Topics
    const topics = await Topic.findAll({
      where: {
        user: userId,
        name: { [Op.iLike]: queryLike },
      },
      attributes: ['id', 'name', 'subject'],
      limit: 10,
    });

    // 2. Search FlashcardDecks
    const decks = await FlashcardDeck.findAll({
      where: {
        user: userId,
        name: { [Op.iLike]: queryLike },
      },
      attributes: ['id', 'name', 'subject'],
      limit: 10,
    });

    // 3. Search Quizzes
    const quizzes = await Quiz.findAll({
      where: {
        createdBy: userId,
        title: { [Op.iLike]: queryLike },
      },
      attributes: ['id', 'title', 'subject'],
      limit: 10,
    });

    // 4. Search StudyPlan Tasks (inside dailyGoals JSONB)
    // Use PostgreSQL JSONB query to filter at database level
    const tasks = await StudyPlan.findAll({
      where: {
        user: userId,
        // Use JSONB array operations to filter matching elements at DB level
        [Op.and]: db.where(
          db.literal(`
            EXISTS (
              SELECT 1 
              FROM jsonb_array_elements(dailyGoals) as goal 
              WHERE LOWER(COALESCE(goal->>'title', '') || COALESCE(goal->>'task', '') || COALESCE(goal->>'text', '')) LIKE LOWER(:query)
            )
          `),
          true
        ),
      },
      attributes: ['id', 'dailyGoals'],
      replacements: { query: queryLike },
      limit: 10,
    });

    // Format tasks to match expected response structure
    const formattedTasks = [];
    tasks.forEach((plan) => {
      const dailyGoals = plan.dailyGoals || [];
      dailyGoals.forEach((goal, gIdx) => {
        const title = goal.title || goal.task || goal.text || '';
        if (title.toLowerCase().includes(q.toLowerCase())) {
          formattedTasks.push({
            id: `${plan.id}-task-${gIdx}`,
            title,
            planId: plan.id,
            completed: goal.completed || false,
          });
        }
      });
    });

    // Limit tasks output (already limited at DB level, but ensure formatting limit)
    const limitedTasks = formattedTasks.slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        topics,
        decks,
        quizzes,
        tasks: limitedTasks,
      },
    });
  } catch (error) {
    console.error('[searchController.globalSearch] Error:', error);
    next(error);
  }
};

// @desc    Semantic Hybrid search using pgvector and lexical scores
// @route   GET /api/search/semantic
// @access  Private
exports.semanticSearch = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) {
      return res.status(200).json({ success: true, data: { notes: [], quizzes: [] } });
    }

    const userId = req.user.id;
    const { generateVector } = require('../services/embeddingService');
    const { Note, Quiz } = require('../models');

    let queryVector;
    try {
      queryVector = await generateVector(q);
    } catch (err) {
      logger.warn('[SearchController] Failed to generate embedding vector:', err.message);
    }

    let notes = [];
    let quizzes = [];

    if (queryVector) {
      try {
        const vectorStr = `[${queryVector.join(',')}]`;
        
        notes = await db.query(
          `SELECT id, title, content, "fileUrl", "fileType",
           (CASE WHEN embedding IS NOT NULL THEN (1 - (embedding <=> :vector::vector)) ELSE 0 END) as similarity,
           (CASE WHEN LOWER(title) LIKE LOWER(:query) OR LOWER(content) LIKE LOWER(:query) THEN 1.0 ELSE 0.0 END) as lexicalScore
           FROM "Notes"
           WHERE "user" = :userId
           ORDER BY (similarity * 0.7 + (CASE WHEN LOWER(title) LIKE LOWER(:query) OR LOWER(content) LIKE LOWER(:query) THEN 1.0 ELSE 0.0 END) * 0.3) DESC
           LIMIT 10`,
          {
            replacements: { vector: vectorStr, query: `%${q}%`, userId },
            type: db.QueryTypes.SELECT,
          }
        );

        quizzes = await db.query(
          `SELECT id, title, questions,
           (CASE WHEN embedding IS NOT NULL THEN (1 - (embedding <=> :vector::vector)) ELSE 0 END) as similarity,
           (CASE WHEN LOWER(title) LIKE LOWER(:query) THEN 1.0 ELSE 0.0 END) as lexicalScore
           FROM "Quizzes"
           WHERE "createdBy" = :userId
           ORDER BY (similarity * 0.7 + (CASE WHEN LOWER(title) LIKE LOWER(:query) THEN 1.0 ELSE 0.0 END) * 0.3) DESC
           LIMIT 10`,
          {
            replacements: { vector: vectorStr, query: `%${q}%`, userId },
            type: db.QueryTypes.SELECT,
          }
        );
      } catch (dbErr) {
        logger.warn('[SearchController] pgvector query failed, running lexical fallback:', dbErr.message);
        queryVector = null; // trigger fallback
      }
    }

    // Lexical fallback if vector generation failed or pgvector query failed
    if (!queryVector) {
      const queryLike = `%${q}%`;
      notes = await Note.findAll({
        where: {
          user: userId,
          [Op.or]: [
            { title: { [Op.iLike]: queryLike } },
            { content: { [Op.iLike]: queryLike } },
          ],
        },
        limit: 10,
      });

      quizzes = await Quiz.findAll({
        where: {
          createdBy: userId,
          title: { [Op.iLike]: queryLike },
        },
        limit: 10,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        notes: notes.map(n => ({
          id: n.id,
          title: n.title,
          content: n.content,
          fileUrl: n.fileUrl,
          fileType: n.fileType,
          score: parseFloat((n.similarity * 0.7 + n.lexicalScore * 0.3 || 0).toFixed(4)),
        })),
        quizzes: quizzes.map(q => ({
          id: q.id,
          title: q.title,
          questionsCount: Array.isArray(q.questions) ? q.questions.length : 0,
          score: parseFloat((q.similarity * 0.7 + q.lexicalScore * 0.3 || 0).toFixed(4)),
        })),
      },
    });
  } catch (error) {
    console.error('[searchController.semanticSearch] Error:', error);
    next(error);
  }
};

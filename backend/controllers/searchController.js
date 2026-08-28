const { Topic, FlashcardDeck, Quiz, StudyPlan } = require('../models');
const { Op } = require('sequelize');
const { sequelize: db } = require('../config/db');
const hybridSearchService = require('../services/hybridSearchService');

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
          results: [],
          topics: [],
          decks: [],
          quizzes: [],
          tasks: [],
        },
      });
    }

    const userId = req.user.id;

    // Hybrid search is best-effort. It depends on an embedding provider, and
    // before this guard a single rate-limit response from that provider failed
    // the whole endpoint - including the topic, deck, quiz and task results
    // below, which are plain SQL and never needed AI at all. This endpoint
    // should never be less reliable than it was before the engine existed.
    let results = [];
    try {
      results = await hybridSearchService.search({
        userId,
        query: q,
        type: req.query.type || 'all',
        subject: req.query.subject,
      });
    } catch (searchError) {
      console.warn('[Search] Hybrid search unavailable, returning SQL results only:', searchError.message);
    }

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
        results,
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

// @desc    Semantic Hybrid search using pgvector and lexical scores with Reciprocal Rank Fusion (RRF)
// @route   GET /api/search/semantic
// @access  Private
exports.semanticSearch = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) {
      return res.status(200).json({ success: true, data: { notes: [], quizzes: [] } });
    }

    const userId = req.user.id;
    const { generateVector } = require('../services/embeddingsProcessor');
    const { Note, Quiz } = require('../models');

    let queryVector;
    try {
      queryVector = await generateVector(q);
    } catch (err) {
      logger.warn('[SearchController] Failed to generate embedding vector:', err.message);
    }

    let notes = [];
    let quizzes = [];
    const k = 60; // RRF parameter

    if (queryVector) {
      try {
        const vectorStr = `[${queryVector.join(',')}]`;
        const queryLike = `%${q}%`;

        // 1. NOTES HYBRID SEARCH WITH RRF
        const [lexicalNotes, vectorNotes] = await Promise.all([
          db.query(
            `SELECT id, title, content, "fileUrl", "fileType"
             FROM "Notes"
             WHERE "user" = :userId AND (LOWER(title) LIKE LOWER(:query) OR LOWER(content) LIKE LOWER(:query))
             LIMIT 50`,
            { replacements: { query: queryLike, userId }, type: db.QueryTypes.SELECT }
          ),
          db.query(
            `SELECT id, title, content, "fileUrl", "fileType",
             (1 - (embedding <=> :vector::vector)) as similarity
             FROM "Notes"
             WHERE "user" = :userId AND "embedding" IS NOT NULL
             ORDER BY similarity DESC
             LIMIT 50`,
            { replacements: { vector: vectorStr, userId }, type: db.QueryTypes.SELECT }
          )
        ]);

        const rrfNotesMap = new Map();
        lexicalNotes.forEach((item, idx) => {
          rrfNotesMap.set(item.id, { item, score: 1 / (k + (idx + 1)) });
        });
        vectorNotes.forEach((item, idx) => {
          if (rrfNotesMap.has(item.id)) {
            rrfNotesMap.get(item.id).score += 1 / (k + (idx + 1));
          } else {
            rrfNotesMap.set(item.id, { item, score: 1 / (k + (idx + 1)) });
          }
        });

        notes = Array.from(rrfNotesMap.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map(entry => ({
            id: entry.item.id,
            title: entry.item.title,
            content: entry.item.content,
            fileUrl: entry.item.fileUrl,
            fileType: entry.item.fileType,
            score: parseFloat(entry.score.toFixed(6)),
          }));

        // 2. QUIZZES HYBRID SEARCH WITH RRF
        const [lexicalQuizzes, vectorQuizzes] = await Promise.all([
          db.query(
            `SELECT id, title, questions
             FROM "Quizzes"
             WHERE "createdBy" = :userId AND LOWER(title) LIKE LOWER(:query)
             LIMIT 50`,
            { replacements: { query: queryLike, userId }, type: db.QueryTypes.SELECT }
          ),
          db.query(
            `SELECT id, title, questions,
             (1 - (embedding <=> :vector::vector)) as similarity
             FROM "Quizzes"
             WHERE "createdBy" = :userId AND "embedding" IS NOT NULL
             ORDER BY similarity DESC
             LIMIT 50`,
            { replacements: { vector: vectorStr, userId }, type: db.QueryTypes.SELECT }
          )
        ]);

        const rrfQuizzesMap = new Map();
        lexicalQuizzes.forEach((item, idx) => {
          rrfQuizzesMap.set(item.id, { item, score: 1 / (k + (idx + 1)) });
        });
        vectorQuizzes.forEach((item, idx) => {
          if (rrfQuizzesMap.has(item.id)) {
            rrfQuizzesMap.get(item.id).score += 1 / (k + (idx + 1));
          } else {
            rrfQuizzesMap.set(item.id, { item, score: 1 / (k + (idx + 1)) });
          }
        });

        quizzes = Array.from(rrfQuizzesMap.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map(entry => ({
            id: entry.item.id,
            title: entry.item.title,
            questionsCount: Array.isArray(entry.item.questions) ? entry.item.questions.length : 0,
            score: parseFloat(entry.score.toFixed(6)),
          }));

      } catch (dbErr) {
        logger.warn('[SearchController] pgvector RRF query failed, running lexical fallback:', dbErr.message);
        queryVector = null; // trigger fallback
      }
    }

    // Lexical fallback if vector generation failed or pgvector query failed
    if (!queryVector) {
      const queryLike = `%${q}%`;
      const fallbackNotes = await Note.findAll({
        where: {
          user: userId,
          [Op.or]: [
            { title: { [Op.iLike]: queryLike } },
            { content: { [Op.iLike]: queryLike } },
          ],
        },
        limit: 10,
      });

      const fallbackQuizzes = await Quiz.findAll({
        where: {
          createdBy: userId,
          title: { [Op.iLike]: queryLike },
        },
        limit: 10,
      });

      notes = fallbackNotes.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        fileUrl: n.fileUrl,
        fileType: n.fileType,
        score: 0,
      }));

      quizzes = fallbackQuizzes.map(q => ({
        id: q.id,
        title: q.title,
        questionsCount: Array.isArray(q.questions) ? q.questions.length : 0,
        score: 0,
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        notes,
        quizzes,
      },
    });
  } catch (error) {
    console.error('[searchController.semanticSearch] Error:', error);
    next(error);
  }
};

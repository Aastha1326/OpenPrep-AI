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

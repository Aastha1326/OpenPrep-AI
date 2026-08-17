const { Topic, FlashcardDeck, Quiz, StudyPlan } = require('../models');
const { Op } = require('sequelize');

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
    const studyPlans = await StudyPlan.findAll({
      where: { user: userId },
      attributes: ['id', 'dailyGoals'],
    });

    const tasks = [];
    studyPlans.forEach((plan) => {
      const dailyGoals = plan.dailyGoals || [];
      dailyGoals.forEach((goal, gIdx) => {
        const title = goal.title || goal.task || goal.text || '';
        if (title.toLowerCase().includes(q.toLowerCase())) {
          tasks.push({
            id: `${plan.id}-task-${gIdx}`,
            title,
            planId: plan.id,
            completed: goal.completed || false,
          });
        }
      });
    });

    // Limit tasks output
    const limitedTasks = tasks.slice(0, 10);

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

const quizRecommendationService = require('../services/quizRecommendationService');
const logger = require('../utils/logger');

/**
 * Controller for personalized quiz recommendations.
 */

// GET /recommendations/:userId or /api/recommendations/:userId
exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeBudget, limit, topic } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const recommendationsData = await quizRecommendationService.getRecommendedQuizzes(userId, {
      timeBudget,
      limit: limit ? parseInt(limit, 10) : 5,
      topicFilter: topic,
    });

    return res.status(200).json({
      success: true,
      ...recommendationsData,
    });
  } catch (err) {
    logger.error('Error fetching quiz recommendations', { error: err.message, userId: req.params.userId });
    return res.status(500).json({
      success: false,
      message: 'Failed to generate quiz recommendations.',
      error: err.message,
    });
  }
};

// POST /recommendations/:userId/hit
exports.recordRecommendationHit = async (req, res) => {
  try {
    const { userId } = req.params;
    const { quizId, recommendationScore, topic } = req.body;

    if (!userId || !quizId) {
      return res.status(400).json({ success: false, message: 'User ID and Quiz ID are required.' });
    }

    const result = await quizRecommendationService.recordRecommendationHit(userId, quizId, {
      recommendationScore,
      topic,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Recommendation hit logged successfully.',
      ...result,
    });
  } catch (err) {
    logger.error('Error logging recommendation hit', { error: err.message, userId: req.params.userId });
    return res.status(500).json({
      success: false,
      message: 'Failed to record recommendation hit.',
      error: err.message,
    });
  }
};

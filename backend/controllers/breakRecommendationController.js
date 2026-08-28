const breakRecommendationService = require('../services/breakRecommendationService');
const ActivityLog = require('../models/ActivityLog');

/**
 * @desc    Generate a new break recommendation
 * @route   POST /api/break-recommendations/generate
 * @access  Private
 */
const generate = async (req, res, next) => {
  try {
    const { subject, taskType } = req.body;
    const recommendation = await breakRecommendationService.generateRecommendation(
      req.user.id, { subject, taskType }
    );

    await ActivityLog.create({
      user: req.user.id,
      activityType: 'break_recommendation',
      description: `Generated break recommendation: ${recommendation.pomodoroLength}min focus / ${recommendation.shortBreakMinutes}min break`,
    });

    res.status(201).json({ success: true, data: recommendation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record a break taken for a recommendation
 * @route   POST /api/break-recommendations/:id/break
 * @access  Private
 */
const recordBreak = async (req, res, next) => {
  try {
    const { breakDurationMinutes, postBreakFocusScore } = req.body;

    if (!breakDurationMinutes || breakDurationMinutes <= 0) {
      return res.status(400).json({ success: false, error: 'breakDurationMinutes must be a positive number' });
    }

    const result = await breakRecommendationService.recordBreak(
      req.user.id, req.params.id, { breakDurationMinutes, postBreakFocusScore }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Recommendation not found' });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record an interruption during a recommendation session
 * @route   POST /api/break-recommendations/:id/interruption
 * @access  Private
 */
const recordInterruption = async (req, res, next) => {
  try {
    const { severity } = req.body;
    const result = await breakRecommendationService.recordInterruption(
      req.user.id, req.params.id, { severity }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Recommendation not found' });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get break effectiveness analytics
 * @route   GET /api/break-recommendations/analytics
 * @access  Private
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await breakRecommendationService.getBreakAnalytics(
      req.user.id, { startDate, endDate }
    );

    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the active (or latest) recommendation
 * @route   GET /api/break-recommendations/active
 * @access  Private
 */
const getActive = async (req, res, next) => {
  try {
    const recommendation = await breakRecommendationService.getActiveRecommendation(req.user.id);

    if (!recommendation) {
      return res.status(404).json({ success: false, error: 'No recommendations found. Generate one first.' });
    }

    res.status(200).json({ success: true, data: recommendation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recommendation history with pagination
 * @route   GET /api/break-recommendations/history
 * @access  Private
 */
const getHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await breakRecommendationService.getRecommendationHistory(req.user.id, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });

    res.status(200).json({
      success: true,
      count: result.recommendations.length,
      ...result.pagination,
      data: result.recommendations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generate,
  recordBreak,
  recordInterruption,
  getAnalytics,
  getActive,
  getHistory,
};

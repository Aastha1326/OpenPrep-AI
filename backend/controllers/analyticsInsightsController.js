/**
 * Analytics Insights Controller
 * Handles HTTP requests for the Study Analytics dashboard.
 */

const {
  getWeeklyStudyOverview,
  getSubjectMastery,
  getQuizPerformanceTrend,
  getActivityTimePattern,
  getStudyRecommendations,
} = require('../services/analyticsInsightsService');

/**
 * GET /api/analytics-insights/weekly-overview
 * Returns per-day study metrics for the last 28 days.
 */
exports.getWeeklyOverview = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 28;
    const data = await getWeeklyStudyOverview(req.user.id, Math.min(days, 90));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics-insights/subject-mastery
 * Returns per-subject mastery metrics.
 */
exports.getSubjectMastery = async (req, res, next) => {
  try {
    const data = await getSubjectMastery(req.user.id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics-insights/quiz-trend
 * Returns quiz accuracy trend over time.
 */
exports.getQuizTrend = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 60;
    const data = await getQuizPerformanceTrend(req.user.id, Math.min(days, 180));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics-insights/activity-pattern
 * Returns hourly activity distribution.
 */
exports.getActivityPattern = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const data = await getActivityTimePattern(req.user.id, Math.min(days, 90));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics-insights/recommendations
 * Returns AI-powered study recommendations based on performance data.
 */
exports.getRecommendations = async (req, res, next) => {
  try {
    const data = await getStudyRecommendations(req.user.id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics-insights/overview
 * Returns all analytics data in a single request (for initial page load).
 */
exports.getFullOverview = async (req, res, next) => {
  try {
    const [weeklyOverview, subjectMastery, quizTrend, activityPattern, recommendations] =
      await Promise.all([
        getWeeklyStudyOverview(req.user.id, 28),
        getSubjectMastery(req.user.id),
        getQuizPerformanceTrend(req.user.id, 60),
        getActivityTimePattern(req.user.id, 30),
        getStudyRecommendations(req.user.id),
      ]);

    res.status(200).json({
      success: true,
      data: {
        weeklyOverview,
        subjectMastery,
        quizTrend,
        activityPattern,
        recommendations,
      },
    });
  } catch (error) {
    next(error);
  }
};

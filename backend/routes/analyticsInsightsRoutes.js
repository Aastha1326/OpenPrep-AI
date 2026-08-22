/**
 * Analytics Insights Routes
 * REST API endpoints for the Study Analytics dashboard.
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getWeeklyOverview,
  getSubjectMastery,
  getQuizTrend,
  getActivityPattern,
  getRecommendations,
  getFullOverview,
} = require('../controllers/analyticsInsightsController');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/analytics-insights/overview:
 *   get:
 *     summary: Get all analytics data in a single request
 *     tags: [Analytics Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complete analytics dataset
 */
router.get('/overview', getFullOverview);

/**
 * @swagger
 * /api/analytics-insights/weekly-overview:
 *   get:
 *     summary: Get per-day study metrics for the last N days
 *     tags: [Analytics Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 28
 *           maximum: 90
 *     responses:
 *       200:
 *         description: Daily study metrics
 */
router.get('/weekly-overview', getWeeklyOverview);

/**
 * @swagger
 * /api/analytics-insights/subject-mastery:
 *   get:
 *     summary: Get per-subject mastery metrics
 *     tags: [Analytics Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subject mastery breakdown
 */
router.get('/subject-mastery', getSubjectMastery);

/**
 * @swagger
 * /api/analytics-insights/quiz-trend:
 *   get:
 *     summary: Get quiz accuracy trend over time
 *     tags: [Analytics Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 60
 *           maximum: 180
 *     responses:
 *       200:
 *         description: Quiz performance trend data
 */
router.get('/quiz-trend', getQuizTrend);

/**
 * @swagger
 * /api/analytics-insights/activity-pattern:
 *   get:
 *     summary: Get hourly activity distribution
 *     tags: [Analytics Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *           maximum: 90
 *     responses:
 *       200:
 *         description: Activity pattern by hour of day
 */
router.get('/activity-pattern', getActivityPattern);

/**
 * @swagger
 * /api/analytics-insights/recommendations:
 *   get:
 *     summary: Get AI-powered study recommendations
 *     tags: [Analytics Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personalized study recommendations
 */
router.get('/recommendations', getRecommendations);

module.exports = router;

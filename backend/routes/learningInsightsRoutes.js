const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getDashboard,
  getQuizPerformance,
  getSubjectMastery,
  getStudyVelocity,
  getTimeDistribution,
  getStreaks,
  getReadinessForecast,
  getWeeklyComparison,
  getPersonalBest,
  getInsightsSummary,
} = require('../controllers/learningInsightsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Learning Insights
 *   description: Analytics dashboard providing study performance, mastery scores, streaks, and readiness forecasting
 */

/**
 * @swagger
 * /api/learning-insights/dashboard:
 *   get:
 *     summary: Get full learning analytics dashboard
 *     tags: [Learning Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: windowDays
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Rolling analysis window in days
 *       - in: query
 *         name: examId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter analytics to a specific exam
 *     responses:
 *       200:
 *         description: Full analytics payload
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.get('/dashboard', protect, getDashboard);

/**
 * @swagger
 * /api/learning-insights/quiz-performance:
 *   get:
 *     summary: Get quiz performance summary with trends and statistics
 *     tags: [Learning Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: windowDays
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: examId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Quiz performance data with daily sparkline
 */
router.get('/quiz-performance', protect, getQuizPerformance);

/**
 * @swagger
 * /api/learning-insights/subject-mastery:
 *   get:
 *     summary: Get subject-level mastery scores and coverage
 *     tags: [Learning Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: examId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Subject mastery breakdown
 */
router.get('/subject-mastery', protect, getSubjectMastery);

/**
 * @swagger
 * /api/learning-insights/study-velocity:
 *   get:
 *     summary: Get study velocity metrics (tasks/day, completion rate)
 *     tags: [Learning Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: windowDays
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Study velocity data with daily sparkline
 */
router.get('/study-velocity', protect, getStudyVelocity);

/**
 * @swagger
 * /api/learning-insights/time-distribution:
 *   get:
 *     summary: Get study time distribution across focus sessions and quizzes
 *     tags: [Learning Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: windowDays
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Time distribution breakdown
 */
router.get('/time-distribution', protect, getTimeDistribution);

/**
 * @swagger
 * /api/learning-insights/streaks:
 *   get:
 *     summary: Get study streak data including current and longest streaks
 *     tags: [Learning Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Streak data with monthly breakdown
 */
router.get('/streaks', protect, getStreaks);

/**
 * @swagger
 * /api/learning-insights/readiness-forecast:
 *   get:
 *     summary: Get exam readiness forecast with projected score
 *     tags: [Learning Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: examId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Readiness forecast with recommendation
 */
router.get('/readiness-forecast', protect, getReadinessForecast);

/**
 * @swagger
 * /api/learning-insights/weekly-comparison:
 *   get:
 *     summary: Get week-over-week comparative report
 *     tags: [Learning Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comparative report with trends
 */
router.get('/weekly-comparison', protect, getWeeklyComparison);

/**
 * @swagger
 * /api/learning-insights/personal-best:
 *   get:
 *     summary: Get personal best records
 *     tags: [Learning Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personal best achievements
 */
router.get('/personal-best', protect, getPersonalBest);

/**
 * @swagger
 * /api/learning-insights/summary:
 *   get:
 *     summary: Get compact insights summary for notifications or email digests
 *     tags: [Learning Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Highlights and stats overview
 */
router.get('/summary', protect, getInsightsSummary);

module.exports = router;

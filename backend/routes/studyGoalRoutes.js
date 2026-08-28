const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  recordProgress,
  bulkRecordProgress,
  getDailyStats,
  getSubjectAnalytics,
  getStreakMetrics,
  generateWeeklyReport,
  getWeeklyReports,
  getLatestWeeklyReport,
  getDashboard,
} = require('../controllers/studyGoalController');

const router = express.Router();

// ── Dashboard ────────────────────────────────────────────────────────────
router.get('/dashboard', protect, getDashboard);

// ── Goal CRUD ────────────────────────────────────────────────────────────
router.post('/', protect, createGoal);
router.get('/', protect, getGoals);
router.get('/stats/daily', protect, getDailyStats);
router.get('/stats/subjects', protect, getSubjectAnalytics);
router.get('/stats/streaks', protect, getStreakMetrics);
router.post('/bulk-progress', protect, bulkRecordProgress);
router.post('/reports/weekly', protect, generateWeeklyReport);
router.get('/reports/weekly/latest', protect, getLatestWeeklyReport);
router.get('/reports/weekly', protect, getWeeklyReports);
router.get('/:id', protect, getGoal);
router.put('/:id', protect, updateGoal);
router.delete('/:id', protect, deleteGoal);
router.post('/:id/progress', protect, recordProgress);

module.exports = router;

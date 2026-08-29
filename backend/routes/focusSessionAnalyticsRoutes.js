const express = require('express');
const { protect } = require('../middleware/auth');
const {
  startSession,
  endSession,
  togglePause,
  recordInterruption,
  getSessions,
  getSession,
  getWeeklyAnalytics,
  getStreaks,
  getDashboardSummary,
  getHourlyHeatmap,
  getEfficiencyTrend,
} = require('../controllers/focusSessionAnalyticsController');

const router = express.Router();

// ── Analytics Dashboard ──────────────────────────────────────────────────
router.get('/analytics/dashboard', protect, getDashboardSummary);
router.get('/analytics/weekly', protect, getWeeklyAnalytics);
router.get('/analytics/streaks', protect, getStreaks);
router.get('/analytics/heatmap', protect, getHourlyHeatmap);
router.get('/analytics/efficiency-trend', protect, getEfficiencyTrend);

// ── Session CRUD ─────────────────────────────────────────────────────────
router.post('/sessions', protect, startSession);
router.get('/sessions', protect, getSessions);
router.get('/sessions/:id', protect, getSession);
router.post('/sessions/:id/end', protect, endSession);
router.post('/sessions/:id/pause', protect, togglePause);
router.post('/sessions/:id/interruption', protect, recordInterruption);

module.exports = router;

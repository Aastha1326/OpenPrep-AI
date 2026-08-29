const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const streakController = require('../controllers/streakController');

// All streak routes require authentication
router.use(protect);

router.get('/summary', streakController.getStreakSummary);
router.get('/heatmap', streakController.getHeatmap);
router.get('/analytics', streakController.getAnalytics);
router.get('/probability', streakController.getProbability);
router.get('/recommendations', streakController.getRecommendations);
router.post('/log', streakController.logActivity);

module.exports = router;

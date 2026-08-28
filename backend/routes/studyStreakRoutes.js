const express = require('express');
const { record, getStats, getHeatmap, getWeekly, getPrediction, getCurrent } = require('../controllers/studyStreakController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/** @swagger tags: [{ name: 'Study Streaks', description: 'Daily study streak tracking and analytics' }] */

router.post('/record', protect, record);
router.get('/stats', protect, getStats);
router.get('/heatmap', protect, getHeatmap);
router.get('/weekly', protect, getWeekly);
router.get('/prediction', protect, getPrediction);
router.get('/current', protect, getCurrent);

module.exports = router;

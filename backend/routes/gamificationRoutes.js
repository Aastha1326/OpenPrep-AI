/**
 * @fileoverview API routes for Gamification features.
 */
const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');

/**
 * @route   POST /api/gamification/action
 * @desc    Record a user action for achievement/streak tracking
 * @access  Private
 */
router.post('/action', gamificationController.recordAction);

/**
 * @route   GET /api/gamification/dashboard
 * @desc    Fetch user stats and global leaderboard
 * @access  Private
 */
router.get('/dashboard', gamificationController.getDashboardData);

module.exports = router;


const express = require('express');
const { protect } = require('../middleware/auth');
const { getSummary, useStreakFreeze } = require('../controllers/gamificationController');

const router = express.Router();

router.use(protect);

router.get('/summary', getSummary);
router.post('/streak-freeze/use', useStreakFreeze);

module.exports = router;

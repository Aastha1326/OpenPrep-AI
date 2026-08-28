/**
 * @fileoverview API routes for Spaced Repetition and Forgetting Curve Analytics.
 */
const express = require('express');
const router = express.Router();
const spacedRepetitionController = require('../controllers/spacedRepetitionController');

/**
 * @route   GET /api/spaced-repetition/queue
 * @desc    Fetch the personalized daily review queue
 * @access  Private
 */
router.get('/queue', spacedRepetitionController.getDailyQueue);

/**
 * @route   POST /api/spaced-repetition/review
 * @desc    Submit a review and update spaced repetition metrics
 * @access  Private
 */
router.post('/review', spacedRepetitionController.submitReview);

/**
 * @route   GET /api/spaced-repetition/analytics
 * @desc    Fetch historical analytics for forgetting curve visualization
 * @access  Private
 */
router.get('/analytics', spacedRepetitionController.getForgettingCurveAnalytics);

module.exports = router;

/**
 * @fileoverview API routes for Interview Analytics.
 */
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/interviewAnalyticsController');

/**
 * @route   POST /api/analytics/interview/process
 * @desc    Analyze and cache a single interview response
 * @access  Private
 */
router.post('/process', analyticsController.processAndCacheAnalytics);

/**
 * @route   GET /api/analytics/interview/user/:userId
 * @desc    Get aggregated analytics for a user
 * @access  Private
 */
router.get('/user/:userId', analyticsController.getUserAnalytics);

module.exports = router;

/**
 * @fileoverview API routes for Lecture Summarization features.
 */
const express = require('express');
const router = express.Router();
const lectureSummaryController = require('../controllers/lectureSummaryController');

/**
 * @route   POST /api/lecture-summaries/generate
 * @desc    Generate a timestamped summary from a video URL
 * @access  Private
 */
router.post('/generate', lectureSummaryController.generateSummary);

module.exports = router;

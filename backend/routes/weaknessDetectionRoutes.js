const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const controller = require('../controllers/weaknessDetectionController');

/**
 * @route   POST /api/weakness/analyze
 * @desc    Run full weakness analysis and create a report snapshot
 * @access  Private
 */
router.post('/analyze', protect, controller.analyze);

/**
 * @route   GET /api/weakness/profile
 * @desc    Get current weakness profile (no report created)
 * @access  Private
 */
router.get('/profile', protect, controller.getProfile);

/**
 * @route   GET /api/weakness/reports
 * @desc    Get paginated list of all weakness reports
 * @access  Private
 */
router.get('/reports', protect, controller.getReports);

/**
 * @route   GET /api/weakness/reports/:id
 * @desc    Get a specific weakness report by ID
 * @access  Private
 */
router.get('/reports/:id', protect, controller.getReportById);

/**
 * @route   GET /api/weakness/trends
 * @desc    Get historical trend data for charting
 * @access  Private
 */
router.get('/trends', protect, controller.getTrends);

/**
 * @route   GET /api/weakness/heatmap
 * @desc    Get heatmap data for visual weakness overview
 * @access  Private
 */
router.get('/heatmap', protect, controller.getHeatmap);

/**
 * @route   GET /api/weakness/recommendations
 * @desc    Get AI-powered recommendations for weak topics
 * @access  Private
 */
router.get('/recommendations', protect, controller.getRecommendations);

/**
 * @route   GET /api/weakness/subject/:subjectId
 * @desc    Get detailed analysis for a specific subject
 * @access  Private
 */
router.get('/subject/:subjectId', protect, controller.getSubjectAnalysis);

module.exports = router;

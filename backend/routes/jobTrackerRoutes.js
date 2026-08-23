const express = require('express');
const router = express.Router();
const JobTrackerController = require('../controllers/JobTrackerController');

// Middleware for auth can be injected here for production
// const requireAuth = require('../middleware/auth');

/**
 * @route   GET /api/jobs/board
 * @desc    Fetch column-segregated Kanban data
 * @access  Private
 */
router.get('/board', JobTrackerController.getBoard);

/**
 * @route   GET /api/jobs/analytics
 * @desc    Retrieve telemetry data (conversations, velocity)
 * @access  Private
 */
router.get('/analytics', JobTrackerController.getAnalytics);

/**
 * @route   POST /api/jobs
 * @desc    Create a new job application in the tracker
 * @access  Private
 */
router.post('/', JobTrackerController.createJob);

/**
 * @route   PUT /api/jobs/:id/move
 * @desc    Move a job across columns or re-order vertically
 * @access  Private
 */
router.put('/:id/move', JobTrackerController.moveJob);


module.exports = router;

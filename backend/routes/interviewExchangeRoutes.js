/**
 * @fileoverview API routes for Peer-to-Peer Mock Interview features.
 */
const express = require('express');
const router = express.Router();
const interviewExchangeController = require('../controllers/interviewExchangeController');

/**
 * @route   POST /api/interview-exchanges
 * @desc    Create a new mock interview request
 * @access  Private
 */
router.post('/', interviewExchangeController.createRequest);

/**
 * @route   GET /api/interview-exchanges/my-exchanges
 * @desc    Get all interview requests and history for the current user
 * @access  Private
 */
router.get('/my-exchanges', interviewExchangeController.getMyExchanges);

/**
 * @route   PUT /api/interview-exchanges/:id/status
 * @desc    Accept or reject an interview request
 * @access  Private
 */
router.put('/:id/status', interviewExchangeController.updateStatus);

/**
 * @route   POST /api/interview-exchanges/:id/feedback
 * @desc    Submit feedback for a completed interview
 * @access  Private
 */
router.post('/:id/feedback', interviewExchangeController.submitFeedback);

module.exports = router;

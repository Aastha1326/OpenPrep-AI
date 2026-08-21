/**
 * @fileoverview API routes for Focus Mode and Study Session tracking.
 */
const express = require('express');
const router = express.Router();
const focusModeController = require('../controllers/focusModeController');

/**
 * @route   POST /api/focus/sessions
 * @desc    Log a completed study session
 * @access  Private
 */
router.post('/sessions', focusModeController.logSession);

/**
 * @route   GET /api/focus/sessions
 * @desc    Retrieve recent study sessions for the user
 * @access  Private
 */
router.get('/sessions', focusModeController.getRecentSessions);

module.exports = router;

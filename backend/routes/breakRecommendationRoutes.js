/**
 * @fileoverview API routes for Study Break Recommendation Engine.
 * Provides personalized pomodoro/break scheduling based on cognitive load analysis.
 */
const express = require('express');
const { protect } = require('../middleware/auth');
const {
  generate,
  recordBreak,
  recordInterruption,
  getAnalytics,
  getActive,
  getHistory,
} = require('../controllers/breakRecommendationController');

const router = express.Router();

// ── Recommendation Generation ────────────────────────────────────────────

/**
 * @route   POST /api/break-recommendations/generate
 * @desc    Generate a personalized break recommendation
 * @access  Private
 */
router.post('/generate', protect, generate);

// ── Active Recommendation ────────────────────────────────────────────────

/**
 * @route   GET /api/break-recommendations/active
 * @desc    Get the current active recommendation
 * @access  Private
 */
router.get('/active', protect, getActive);

// ── Analytics ────────────────────────────────────────────────────────────

/**
 * @route   GET /api/break-recommendations/analytics
 * @desc    Get break effectiveness analytics
 * @access  Private
 */
router.get('/analytics', protect, getAnalytics);

// ── History ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/break-recommendations/history
 * @desc    Get recommendation history
 * @access  Private
 */
router.get('/history', protect, getHistory);

// ── Session Tracking ─────────────────────────────────────────────────────

/**
 * @route   POST /api/break-recommendations/:id/break
 * @desc    Record a break taken for a recommendation
 * @access  Private
 */
router.post('/:id/break', protect, recordBreak);

/**
 * @route   POST /api/break-recommendations/:id/interruption
 * @desc    Record an interruption during a recommendation session
 * @access  Private
 */
router.post('/:id/interruption', protect, recordInterruption);

module.exports = router;

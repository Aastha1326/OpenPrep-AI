const express = require('express');
const {
  generate,
  getActive,
  getAll,
  getById,
  markViewed,
  recordFeedback,
  completeAction,
  archive,
} = require('../controllers/examStrategyController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Exam Strategies
 *   description: AI-powered exam strategy generation and management
 */

// Generate a new AI strategy (rate-limited, uses AI quota)
router.post('/generate', protect, aiLimiter, generate);

// Get the current active strategy
router.get('/active', protect, getActive);

// List all strategies (paginated)
router.get('/', protect, getAll);

// Get a specific strategy by ID
router.get('/:id', protect, getById);

// Mark strategy as viewed
router.put('/:id/view', protect, markViewed);

// Record feedback on a strategy
router.put('/:id/feedback', protect, recordFeedback);

// Mark a priority action as completed
router.put('/:id/complete-action', protect, completeAction);

// Archive a strategy
router.delete('/:id', protect, archive);

module.exports = router;

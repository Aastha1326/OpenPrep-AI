const express = require('express');
const {
  createBounty,
  getBounties,
  getBountyDetails,
  submitSolution,
  acceptSolution,
  voteSolution
} = require('../controllers/bountyController');
const { protect } = require('../middleware/auth');
const { generalRateLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Public / Protected List & Details
router.get('/', getBounties);
router.get('/:id', getBountyDetails);

// Protected Actions
router.post('/', protect, generalRateLimiter, createBounty);
router.post('/:id/solutions', protect, generalRateLimiter, submitSolution);
router.post('/:id/accept/:solutionId', protect, acceptSolution);
router.post('/:id/solutions/:solutionId/vote', protect, voteSolution);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  submitSuggestion,
  getDeckSuggestions,
  updateSuggestionStatus,
} = require('../controllers/deckVersionController');

router.post('/:deckId/suggest', protect, submitSuggestion);
router.get('/:deckId/suggestions', protect, getDeckSuggestions);
router.patch('/suggestions/:id/status', protect, updateSuggestionStatus);

module.exports = router;

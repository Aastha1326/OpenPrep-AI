const express = require('express');
const {
  createDeck,
  getDecks,
  getDeckById,
  deleteDeck,
  shareDeck,
} = require('../controllers/flashcardDeckController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createDeck)
  .get(protect, getDecks);

router.route('/:id')
  .get(protect, getDeckById)
  .delete(protect, deleteDeck);

router.post('/:id/share', protect, shareDeck);

module.exports = router;

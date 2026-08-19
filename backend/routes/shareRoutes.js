const express = require('express');
const {
  getSharedDeck,
  cloneSharedDeck,
} = require('../controllers/flashcardDeckController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/:shareToken', getSharedDeck);
router.post('/:shareToken/clone', protect, cloneSharedDeck);

module.exports = router;

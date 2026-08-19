const express = require('express');
const { getPublicDeckById } = require('../controllers/flashcardDeckController');

const router = express.Router();

router.get('/shared/:deckId', getPublicDeckById);

module.exports = router;

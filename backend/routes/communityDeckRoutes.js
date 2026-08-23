/**
 * @fileoverview API routes for Community Flashcard Deck features.
 */
const express = require('express');
const router = express.Router();
const communityDeckController = require('../controllers/communityDeckController');

/**
 * @route   GET /api/community-decks
 * @desc    Fetch trending community decks with optional filters
 * @access  Public
 */
router.get('/', communityDeckController.getTrendingDecks);

/**
 * @route   POST /api/community-decks/:deckId/vote
 * @desc    Upvote or downvote a specific community deck
 * @access  Private
 */
router.post('/:deckId/vote', communityDeckController.voteOnDeck);

module.exports = router;

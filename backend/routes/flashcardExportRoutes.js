/**
 * @fileoverview API routes for Flashcard Export functionality.
 */
const express = require('express');
const router = express.Router();
const flashcardExportController = require('../controllers/flashcardExportController');

/**
 * @route   GET /api/flashcards/export/:deckId/anki
 * @desc    Download a flashcard deck as an Anki .apkg file
 * @access  Private
 */
router.get('/:deckId/anki', flashcardExportController.exportToAnki);

module.exports = router;

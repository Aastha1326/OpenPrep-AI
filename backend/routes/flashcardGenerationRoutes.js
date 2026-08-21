/**
 * @fileoverview API routes for Flashcard Generation features.
 */
const express = require('express');
const router = express.Router();
const flashcardGenerationController = require('../controllers/flashcardGenerationController');

/**
 * @route   POST /api/flashcards/generate/youtube
 * @desc    Generate flashcards from a YouTube video transcript
 * @access  Private
 */
router.post('/youtube', flashcardGenerationController.generateFromYoutube);

module.exports = router;

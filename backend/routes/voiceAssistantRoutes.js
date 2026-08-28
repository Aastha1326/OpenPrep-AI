/**
 * @fileoverview API routes for Voice-Activated Study Assistant.
 */
const express = require('express');
const router = express.Router();
const voiceAssistantController = require('../controllers/voiceAssistantController');

/**
 * @route   POST /api/voice-assistant/query
 * @desc    Process a complex voice query requiring contextual understanding
 * @access  Private
 */
router.post('/query', voiceAssistantController.processVoiceQuery);

module.exports = router;

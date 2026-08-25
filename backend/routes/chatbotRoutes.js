/**
 * @fileoverview API routes for the AI Study Companion.
 */
const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

/**
 * @route   POST /api/chatbot/message
 * @desc    Send a message and receive an AI response
 * @access  Private
 */
router.post('/message', chatbotController.sendMessage);

/**
 * @route   POST /api/chatbot/session/:sessionId/clear
 * @desc    Clear the conversation history for a specific session
 * @access  Private
 */
router.post('/session/:sessionId/clear', chatbotController.clearSession);

module.exports = router;

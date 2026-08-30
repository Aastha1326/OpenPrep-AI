/**
 * @fileoverview API routes for the RAG-based AI Tutor Chatbot.
 */
const express = require('express');
const router = express.Router();
const ragTutorController = require('../controllers/ragTutorController');

/**
 * @route   POST /api/rag-tutor/chat
 * @desc    Process a user query with RAG over personal notes and return a cited response
 * @access  Private
 */
router.post('/chat', ragTutorController.chatWithTutor);

module.exports = router;

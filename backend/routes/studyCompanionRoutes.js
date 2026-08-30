const express = require('express');
const { createSession, sendMessage, getHistory, getSessions, rateMessage, getStats } = require('../controllers/studyCompanionController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/** @swagger tags: [{ name: 'Study Companion', description: 'AI-powered study companion chatbot' }] */

router.post('/sessions', protect, createSession);
router.get('/sessions', protect, getSessions);
router.get('/stats', protect, getStats);
router.post('/:sessionId/messages', protect, aiLimiter, sendMessage);
router.get('/:sessionId/messages', protect, getHistory);
router.put('/messages/:id/rate', protect, rateMessage);

module.exports = router;

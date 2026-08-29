const express = require('express');
const { generate, getActive, getAll, getById, markViewed, rate, dismiss, getStats } = require('../controllers/studyTipController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/** @swagger tags: [{ name: 'Study Tips', description: 'AI-powered personalized study tips' }] */

router.post('/generate', protect, aiLimiter, generate);
router.get('/active', protect, getActive);
router.get('/stats', protect, getStats);
router.get('/', protect, getAll);
router.get('/:id', protect, getById);
router.put('/:id/view', protect, markViewed);
router.put('/:id/rate', protect, rate);
router.put('/:id/dismiss', protect, dismiss);

module.exports = router;

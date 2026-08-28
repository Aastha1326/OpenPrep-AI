const express = require('express');
const { create, getAll, getStats, getSuggestions, getById, toggle, remove, snooze } = require('../controllers/studyReminderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/** @swagger tags: [{ name: 'Study Reminders', description: 'Personalized study reminders with AI timing' }] */

router.post('/', protect, create);
router.get('/stats', protect, getStats);
router.get('/suggestions', protect, getSuggestions);
router.get('/', protect, getAll);
router.get('/:id', protect, getById);
router.put('/:id/toggle', protect, toggle);
router.put('/:id/snooze', protect, snooze);
router.delete('/:id', protect, remove);

module.exports = router;

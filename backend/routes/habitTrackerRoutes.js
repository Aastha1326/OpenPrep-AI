/**
 * @fileoverview Express router for the Study Habit Tracker & Streak Calendar.
 * All routes require JWT authentication via the `protect` middleware.
 */
const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createHabit,
  listHabits,
  getHabit,
  updateHabit,
  archiveHabit,
  deleteHabit,
  logHabit,
  batchLogHabits,
  getLogs,
  getCalendarHeatmap,
  getWeeklySummary,
  getDashboard,
  recalculateStreaks,
} = require('../controllers/habitTrackerController');

const router = express.Router();

// ── Dashboard ────────────────────────────────────────────────────────────
router.get('/dashboard', protect, getDashboard);

// ── Calendar & Analytics ─────────────────────────────────────────────────
router.get('/calendar', protect, getCalendarHeatmap);
router.get('/weekly', protect, getWeeklySummary);

// ── Batch Operations ─────────────────────────────────────────────────────
router.post('/batch-log', protect, batchLogHabits);
router.post('/streaks/recalculate', protect, recalculateStreaks);

// ── Logs ─────────────────────────────────────────────────────────────────
router.get('/logs', protect, getLogs);

// ── Habit CRUD ───────────────────────────────────────────────────────────
router.post('/', protect, createHabit);
router.get('/', protect, listHabits);
router.get('/:id', protect, getHabit);
router.put('/:id', protect, updateHabit);
router.delete('/:id', protect, archiveHabit);

// ── Per-Habit Actions ────────────────────────────────────────────────────
router.post('/:id/log', protect, logHabit);
router.delete('/:id/permanent', protect, deleteHabit);

module.exports = router;

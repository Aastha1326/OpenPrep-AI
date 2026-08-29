const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createSchedule,
  getSchedules,
  getSchedule,
  getTodaysSlots,
  getCalendarSlots,
  completeSlot,
  skipSlot,
  rescheduleSlot,
  updateScheduleStatus,
  deleteSchedule,
} = require('../controllers/revisionSchedulerController');

const router = express.Router();

// ── Schedule CRUD ────────────────────────────────────────────────────────
router.post('/', protect, createSchedule);
router.get('/today', protect, getTodaysSlots);
router.get('/calendar', protect, getCalendarSlots);
router.get('/', protect, getSchedules);
router.get('/:id', protect, getSchedule);
router.put('/:id/status', protect, updateScheduleStatus);
router.delete('/:id', protect, deleteSchedule);

// ── Slot Actions ─────────────────────────────────────────────────────────
router.post('/slots/:slotId/complete', protect, completeSlot);
router.post('/slots/:slotId/skip', protect, skipSlot);
router.post('/slots/:slotId/reschedule', protect, rescheduleSlot);

module.exports = router;

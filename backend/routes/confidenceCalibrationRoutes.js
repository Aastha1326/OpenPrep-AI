const express = require('express');
const { protect } = require('../middleware/auth');
const {
  rateTopic,
  bulkRate,
  getRatings,
  deleteRating,
  runCalibration,
  getCalibrationReport,
  getTopicCalibration,
} = require('../controllers/confidenceCalibrationController');

const router = express.Router();

// ── Calibration Report (before param routes) ─────────────────────────────
router.get('/report', protect, getCalibrationReport);

// ── Run Calibration ──────────────────────────────────────────────────────
router.post('/run', protect, runCalibration);

// ── Bulk Rating ──────────────────────────────────────────────────────────
router.post('/rate/bulk', protect, bulkRate);

// ── Rating CRUD ──────────────────────────────────────────────────────────
router.post('/rate', protect, rateTopic);
router.get('/ratings', protect, getRatings);
router.get('/topics/:topicId', protect, getTopicCalibration);
router.delete('/ratings/:topicId', protect, deleteRating);

module.exports = router;

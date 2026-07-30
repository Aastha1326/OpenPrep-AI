const express = require('express');
const {
  getDashboardStats,
  getSubjectBreakdown,
  getStudyHours,
  trackStudyTime,
  updateTopicProgress,
  getActivityFeed,
  exportCSV,
  exportPDF,
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');
const {
  validateTrackStudyTime,
  validateUpdateTopicProgress,
} = require('../middleware/validators');

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/dashboard', protect, getDashboardStats);
router.get('/subjects', protect, getSubjectBreakdown);
router.get('/study-hours', protect, getStudyHours);
router.get('/export/csv', protect, exportCSV);
router.get('/export/pdf', protect, exportPDF);
router.post('/track', protect, validateTrackStudyTime, trackStudyTime);
router.put('/topic/:id', protect, validateUpdateTopicProgress, updateTopicProgress);
router.get('/activity', protect, getActivityFeed);

module.exports = router;

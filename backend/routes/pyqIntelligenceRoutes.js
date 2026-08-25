const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const controller = require('../controllers/pyqIntelligenceController');

router.get('/frequency/:subjectId', protect, controller.getFrequencyAnalysis);
router.get('/trends/:subjectId', protect, controller.getTrendAnalysis);
router.get('/repeats/:subjectId', protect, controller.getRepeatDetection);
router.get('/recommendations/:subjectId', protect, controller.getSmartRecommendations);
router.get('/compare/:subjectId', protect, controller.compareYearRanges);
router.get('/full-intelligence/:subjectId', protect, controller.getFullIntelligence);

module.exports = router;

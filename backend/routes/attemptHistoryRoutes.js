const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const controller = require('../controllers/attemptHistoryController');

router.get('/history', protect, controller.getAttemptHistory);
router.get('/trends', protect, controller.getScoreTrends);
router.get('/topic-progress', protect, controller.getTopicProgress);
router.get('/summary', protect, controller.getPerformanceSummary);

module.exports = router;

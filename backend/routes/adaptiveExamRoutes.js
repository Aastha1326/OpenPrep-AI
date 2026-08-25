const express = require('express');
const {
  startAdaptiveExam,
  submitAdaptiveAnswer,
  getAdaptiveScoreReport,
} = require('../controllers/adaptiveExamController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/start', protect, startAdaptiveExam);
router.post('/:sessionId/submit-answer', protect, submitAdaptiveAnswer);
router.get('/:sessionId/score-report', protect, getAdaptiveScoreReport);

module.exports = router;

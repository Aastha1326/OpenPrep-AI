const express = require('express');
const { protect } = require('../middleware/auth');
const { updateBaseline, logProctoringEvent, getProctoringReport } = require('../controllers/proctoringController');

const router = express.Router();

router.use(protect);

router.post('/baseline', updateBaseline);
router.post('/log', logProctoringEvent);
router.get('/report/:quizAttemptId', getProctoringReport);

module.exports = router;

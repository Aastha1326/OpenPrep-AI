const express = require('express');
const router = express.Router();
const MockInterviewController = require('../controllers/MockInterviewController');

/**
 * @route   POST /api/interviews/init
 * @desc    Configure and schedule a new AI interview
 */
router.post('/init', MockInterviewController.initiate);
/**
 * @route   GET /api/interviews/:id/evaluation
 * @desc    Get the evaluation version and historical evaluation metadata
 */
router.get('/:id/evaluation', MockInterviewController.getEvaluation);

/**
 * @route   GET /api/interviews/:id/compare/:version
 * @desc    Compare the interview against another evaluation version
 */
router.get(
  '/:id/compare/:version',
  MockInterviewController.compareEvaluation
);
/**
 * @route   POST /api/interviews/:id/start
 * @desc    Launch an interview and receive first AI question
 */
/**
 * @route   GET /api/interviews/:id/feedback-provenance
 * @desc    Get AI feedback evidence and provenance metadata
 */
router.get(
    '/:id/feedback-provenance',
    MockInterviewController.getFeedbackProvenance
);
router.post('/:id/start', MockInterviewController.start);

/**
 * @route   POST /api/interviews/:id/reply
 * @desc    Send candidate audio/text and get AI response
 */
router.post('/:id/reply', MockInterviewController.submitReply);

/**
 * @route   POST /api/interviews/:id/conclude
 * @desc    End session and generate final telemetry scoring
 */
router.post('/:id/conclude', MockInterviewController.conclude);
/**
 * @route   GET /api/interviews/:id/processing-status
 * @desc    Get asynchronous interview processing status
 */
router.get(
  '/:id/processing-status',
  MockInterviewController.processingStatus
);

/**
 * @route   POST /api/interviews/:id/processing-retry/:jobId
 * @desc    Retry a failed interview processing job
 */
router.post(
  '/:id/processing-retry/:jobId',  MockInterviewController.retryProcessing
);
module.exports = router;

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

module.exports = router;

/**
 * @fileoverview API routes for Interactive Code Sandbox.
 */
const express = require('express');
const router = express.Router();
const codeRunnerController = require('../controllers/codeRunnerController');

/**
 * @route   POST /api/code/run-sample
 * @desc    Executes code against sample visible test cases
 * @access  Private
 */
router.post('/run-sample', codeRunnerController.runSample);

/**
 * @route   POST /api/code/submit
 * @desc    Grades code against complete hidden test suite
 * @access  Private
 */
router.post('/submit', codeRunnerController.submitForGrading);

module.exports = router;

/**
 * @fileoverview API routes for Exam Simulation and Proctoring.
 */
const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

/**
 * @route   POST /api/exam-simulation/start
 * @desc    Initialize a new exam simulation session
 * @access  Private
 */
router.post('/start', simulationController.startSimulation);

/**
 * @route   POST /api/exam-simulation/submit
 * @desc    Submit exam answers and generate post-exam analytics report
 * @access  Private
 */
router.post('/submit', simulationController.submitSimulation);

module.exports = router;

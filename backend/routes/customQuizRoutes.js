/**
 * @fileoverview API routes for Custom Quiz Generation and Management.
 */
const express = require('express');
const router = express.Router();
const customQuizController = require('../controllers/customQuizController');

/**
 * @route   POST /api/custom-quizzes/generate
 * @desc    Generate a custom quiz based on topics, difficulty, and type
 * @access  Private
 */
router.post('/generate', customQuizController.generateQuiz);

/**
 * @route   POST /api/custom-quizzes/submit
 * @desc    Submit quiz answers and log performance for analytics
 * @access  Private
 */
router.post('/submit', customQuizController.submitQuiz);

module.exports = router;

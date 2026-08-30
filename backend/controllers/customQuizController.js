/**
 * @fileoverview Controller for handling custom quiz generation and performance logging.
 */
const quizGenerationService = require('../services/quizGenerationService');
// const QuizSession = require('../models/QuizSession');

/**
 * Generates a custom quiz based on user-selected parameters.
 */
const generateQuiz = async (req, res) => {
    try {
        const { topics, questionCount, difficulty, questionType } = req.body;
        // const userId = req.user.id;

        if (!Array.isArray(topics) || topics.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one topic is required.' });
        }

        if (!questionCount || questionCount < 1 || questionCount > 20) {
            return res.status(400).json({ success: false, message: 'Question count must be between 1 and 20.' });
        }

        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return res.status(400).json({ success: false, message: 'Invalid difficulty level.' });
        }

        if (!['multiple_choice', 'short_answer'].includes(questionType)) {
            return res.status(400).json({ success: false, message: 'Invalid question type.' });
        }

        const questions = await quizGenerationService.generateCustomQuiz(
            topics,
            questionCount,
            difficulty,
            questionType
        );

        const sessionId = `quiz_${Date.now()}`;

        // Mock session creation
        // await QuizSession.create({ userId, sessionId, topics, difficulty, questions, status: 'active' });

        res.status(201).json({
            success: true,
            data: {
                sessionId,
                questions,
                metadata: { topics, difficulty, questionType, totalQuestions: questions.length }
            }
        });
    } catch (error) {
        console.error('Error generating quiz:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

/**
 * Logs quiz performance and updates weak area analytics.
 */
const submitQuiz = async (req, res) => {
    try {
        const { sessionId, answers } = req.body;
        // const userId = req.user.id;

        if (!sessionId || !Array.isArray(answers)) {
            return res.status(400).json({ success: false, message: 'sessionId and answers array are required.' });
        }

        // Mock performance calculation and analytics update
        const score = answers.filter(a => a.isCorrect).length;
        const percentage = Math.round((score / answers.length) * 100);

        res.status(200).json({
            success: true,
            data: {
                sessionId,
                score,
                totalQuestions: answers.length,
                percentage,
                message: 'Quiz submitted and analytics updated successfully.'
            }
        });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    generateQuiz,
    submitQuiz,
};

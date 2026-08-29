/**
 * @fileoverview Controller for managing exam simulation sessions and analytics reporting.
 */
const examSimulationService = require('../services/examSimulationService');
// const ExamSession = require('../models/ExamSession');

/**
 * Starts a new exam simulation session.
 */
const startSimulation = async (req, res) => {
    try {
        const { examId } = req.body;
        // const userId = req.user.id;

        if (!examId) {
            return res.status(400).json({ success: false, message: 'examId is required.' });
        }

        const sessionId = `session_${Date.now()}`;

        // Mock session creation
        // await ExamSession.create({ userId, examId, sessionId, status: 'active', startTime: new Date() });

        res.status(200).json({
            success: true,
            data: {
                sessionId,
                examId,
                rules: 'Full-screen mode required. Tab switching will be logged and affect your integrity score.'
            }
        });
    } catch (error) {
        console.error('Error starting simulation:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Submits the exam and generates the post-exam analytics report.
 */
const submitSimulation = async (req, res) => {
    try {
        const { sessionId, questionLogs, totalFocusLossEvents, totalExamDurationSeconds } = req.body;

        if (!sessionId || !Array.isArray(questionLogs)) {
            return res.status(400).json({ success: false, message: 'sessionId and questionLogs array are required.' });
        }

        const analytics = examSimulationService.generateExamAnalytics(
            questionLogs,
            totalFocusLossEvents,
            totalExamDurationSeconds
        );

        // Mock updating session status
        // await ExamSession.update({ status: 'completed', analytics }, { where: { sessionId } });

        res.status(200).json({
            success: true,
            data: {
                sessionId,
                analytics
            }
        });
    } catch (error) {
        console.error('Error submitting simulation:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    startSimulation,
    submitSimulation,
};

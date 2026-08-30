/**
 * @fileoverview Controller for managing study sessions and focus mode analytics.
 */
// const StudySession = require('../models/StudySession');

/**
 * Logs a completed study session.
 */
const logSession = async (req, res) => {
    try {
        const { topic, durationMinutes, focusScore } = req.body;
        // const userId = req.user.id;

        if (!durationMinutes || durationMinutes <= 0) {
            return res.status(400).json({ success: false, message: 'Valid duration is required.' });
        }

        // Mock DB creation
        // const session = await StudySession.create({ userId, topic, durationMinutes, focusScore });

        res.status(201).json({
            success: true,
            message: 'Study session logged successfully.',
            data: { id: 'mock-id', topic, durationMinutes, focusScore }
        });
    } catch (error) {
        console.error('Error logging session:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * Retrieves recent study sessions for analytics.
 */
const getRecentSessions = async (req, res) => {
    try {
        // Mock response
        res.status(200).json({
            success: true,
            data: [
                { id: '1', topic: 'Calculus', durationMinutes: 25, focusScore: 4, createdAt: new Date().toISOString() },
                { id: '2', topic: 'Physics', durationMinutes: 50, focusScore: 5, createdAt: new Date(Date.now() - 86400000).toISOString() },
            ]
        });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = {
    logSession,
    getRecentSessions,
};

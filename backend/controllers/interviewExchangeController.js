/**
 * @fileoverview Controller for managing mock interview scheduling and feedback.
 */
// const InterviewExchange = require('../models/InterviewExchange');

/**
 * Creates a new interview request.
 */
const createRequest = async (req, res) => {
    try {
        const { receiverId, subject, scheduledTime } = req.body;
        // const requesterId = req.user.id;

        if (!receiverId || !subject || !scheduledTime) {
            return res.status(400).json({ success: false, message: 'receiverId, subject, and scheduledTime are required.' });
        }

        // Mock DB creation
        const newExchange = {
            id: `exchange_${Date.now()}`,
            requesterId: 'mock-requester-id',
            receiverId,
            subject,
            scheduledTime,
            status: 'pending',
        };

        res.status(201).json({ success: true, data: newExchange });
    } catch (error) {
        console.error('Error creating interview request:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * Updates the status of an interview request (accept/reject).
 */
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status update.' });
        }

        // Mock DB update
        res.status(200).json({ success: true, message: `Interview ${status} successfully.` });
    } catch (error) {
        console.error('Error updating interview status:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * Submits structured feedback after a completed interview.
 */
const submitFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { communication, technical, comments } = req.body;

        if (!communication || !technical || !comments) {
            return res.status(400).json({ success: false, message: 'All feedback fields are required.' });
        }

        // Mock DB update
        res.status(200).json({ success: true, message: 'Feedback submitted successfully.' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * Retrieves all interview exchanges for the current user.
 */
const getMyExchanges = async (req, res) => {
    try {
        // const userId = req.user.id;

        // Mock response
        const mockExchanges = [
            {
                id: 'ex-1',
                partnerName: 'Alice',
                subject: 'System Design',
                scheduledTime: new Date(Date.now() + 86400000).toISOString(),
                status: 'accepted',
                role: 'requester',
            },
            {
                id: 'ex-2',
                partnerName: 'Bob',
                subject: 'React Fundamentals',
                scheduledTime: new Date(Date.now() - 86400000).toISOString(),
                status: 'completed',
                role: 'receiver',
                feedback: { communication: 4, technical: 5, comments: 'Great understanding of hooks!' }
            }
        ];

        res.status(200).json({ success: true, data: mockExchanges });
    } catch (error) {
        console.error('Error fetching exchanges:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = {
    createRequest,
    updateStatus,
    submitFeedback,
    getMyExchanges,
};

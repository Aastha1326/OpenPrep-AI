/**
 * @fileoverview Controller for managing AI study companion chat sessions.
 */
const studyBotService = require('../services/studyBotService');
// const ChatSession = require('../models/ChatSession');

/**
 * Sends a message and gets an AI response, updating the session.
 */
const sendMessage = async (req, res) => {
    try {
        const { sessionId, message, topic } = req.body;
        // const userId = req.user.id;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ success: false, message: 'Message content is required.' });
        }

        // Mock DB retrieval
        let session = { id: sessionId || 'new-session', messages: [], topic: topic || 'General' };

        // If new session, we would create it. If existing, fetch it.
        // For this implementation, we'll simulate appending to the mock session.

        const aiResponse = await studyBotService.generateStudyResponse(session.messages, message);

        const newMessages = [
            ...session.messages,
            { role: 'user', content: message, timestamp: new Date().toISOString() },
            { role: 'model', content: aiResponse, timestamp: new Date().toISOString() },
        ];

        // Mock DB save
        // if (sessionId) {
        //   await ChatSession.update({ messages: newMessages }, { where: { id: sessionId } });
        // } else {
        //   session = await ChatSession.create({ userId, topic, messages: newMessages });
        // }

        res.status(200).json({
            success: true,
            data: {
                sessionId: session.id,
                response: aiResponse,
                messages: newMessages,
            },
        });
    } catch (error) {
        console.error('Error in chatbot:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
    }
};

/**
 * Clears the conversation history for a session.
 */
const clearSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Mock DB update
        // await ChatSession.update({ messages: [] }, { where: { id: sessionId } });

        res.status(200).json({
            success: true,
            message: 'Conversation history cleared.',
        });
    } catch (error) {
        console.error('Error clearing session:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = {
    sendMessage,
    clearSession,
};

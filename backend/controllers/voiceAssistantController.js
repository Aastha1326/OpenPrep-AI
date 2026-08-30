/**
 * @fileoverview Controller for handling voice assistant fallback queries.
 */
const voiceCommandService = require('../services/voiceCommandService');

/**
 * Processes a complex voice query that the frontend could not handle locally.
 */
const processVoiceQuery = async (req, res) => {
    try {
        const { transcript, currentTopic } = req.body;

        if (!transcript || transcript.trim().length < 3) {
            return res.status(400).json({ success: false, message: 'Valid transcript is required.' });
        }

        const result = await voiceCommandService.processComplexVoiceQuery(transcript, currentTopic || '');

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error processing voice query:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

module.exports = {
    processVoiceQuery,
};

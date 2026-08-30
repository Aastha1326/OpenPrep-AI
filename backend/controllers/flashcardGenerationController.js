/**
 * @fileoverview Controller for handling YouTube to Flashcard generation requests.
 */
const youtubeService = require('../services/youtubeTranscriptService');

/**
 * Processes a YouTube URL and returns generated flashcards.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const generateFromYoutube = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'A valid YouTube URL is required.'
            });
        }

        // Basic URL validation
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid YouTube URL.'
            });
        }

        const flashcards = await youtubeService.processYouTubeToFlashcards(url);

        res.status(200).json({
            success: true,
            data: flashcards,
        });
    } catch (error) {
        console.error('Error generating flashcards from YouTube:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error during generation.'
        });
    }
};

module.exports = {
    generateFromYoutube,
};

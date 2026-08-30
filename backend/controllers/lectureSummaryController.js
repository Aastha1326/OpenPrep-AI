/**
 * @fileoverview Controller for handling lecture video summarization requests.
 */
const videoSummaryService = require('../services/videoSummarizationService');

/**
 * Processes a video URL and returns a timestamped summary.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const generateSummary = async (req, res) => {
    try {
        const { videoUrl } = req.body;

        if (!videoUrl || typeof videoUrl !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'A valid video URL is required.'
            });
        }

        // Extract video ID (simplified regex for YouTube)
        const videoIdMatch = videoUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid YouTube URL format.'
            });
        }

        const transcript = await videoSummaryService.fetchVideoTranscript(videoId);
        const summaryData = await videoSummaryService.summarizeLecture(transcript);

        res.status(200).json({
            success: true,
            data: {
                videoId,
                ...summaryData,
            },
        });
    } catch (error) {
        console.error('Error generating lecture summary:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error during summarization.'
        });
    }
};

module.exports = {
    generateSummary,
};

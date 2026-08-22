/**
 * @fileoverview Controller for aggregating and serving interview analytics data.
 */
const sentimentService = require('../services/sentimentAnalysisService');
// const InterviewAnalytics = require('../models/InterviewAnalytics');

/**
 * Processes a new response and caches the analytics.
 */
const processAndCacheAnalytics = async (req, res) => {
    try {
        const { userId, sessionId, userResponse } = req.body;

        if (!userId || !sessionId || !userResponse) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        // 1. Analyze
        const analysis = await sentimentService.analyzeResponseSentiment(userResponse);

        // 2. Cache in DB (Mocked)
        // await InterviewAnalytics.create({
        //   userId, sessionId, ...analysis
        // });

        res.status(200).json({ success: true, data: analysis });
    } catch (error) {
        console.error('Error processing analytics:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Retrieves aggregated analytics for a user over a specific time range.
 */
const getUserAnalytics = async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 30 } = req.query;

        // Mocked historical data generation for demonstration
        const mockData = Array.from({ length: Math.min(days, 15) }, (_, i) => ({
            date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            confidenceScore: Math.floor(Math.random() * 4) + 6, // 6-9
            sentiment: Math.random() > 0.3 ? 'positive' : 'neutral',
        })).reverse();

        res.status(200).json({
            success: true,
            data: {
                trend: mockData,
                averageConfidence: (mockData.reduce((acc, curr) => acc + curr.confidenceScore, 0) / mockData.length).toFixed(1),
                topKeywords: ['React', 'System Design', 'Node.js', 'PostgreSQL', 'Testing'],
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = {
    processAndCacheAnalytics,
    getUserAnalytics,
};

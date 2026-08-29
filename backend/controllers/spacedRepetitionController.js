/**
 * @fileoverview Controller for managing spaced repetition queues and analytics.
 */
const forgettingCurveService = require('../services/forgettingCurveService');
// const Flashcard = require('../models/Flashcard');
// const ReviewLog = require('../models/ReviewLog');

/**
 * Fetches the personalized daily review queue for the user.
 */
const getDailyQueue = async (req, res) => {
    try {
        // Mock data representing user's flashcards/topics
        const mockUserItems = [
            { id: 'fc_1', content: 'React Hooks', lastReviewDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), interval: 3, repetitions: 2, easeFactor: 2.5, memoryStrength: 3.0 },
            { id: 'fc_2', content: 'Closures in JS', lastReviewDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), interval: 4, repetitions: 3, easeFactor: 2.4, memoryStrength: 3.8 },
            { id: 'fc_3', content: 'Event Loop', lastReviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), interval: 1, repetitions: 1, easeFactor: 2.5, memoryStrength: 1.0 },
        ];

        const queue = forgettingCurveService.generateDailyReviewQueue(mockUserItems);

        res.status(200).json({
            success: true,
            data: {
                queue,
                totalDue: queue.length,
                averageRetention: queue.length > 0
                    ? (queue.reduce((acc, item) => acc + item.retentionProbability, 0) / queue.length).toFixed(2)
                    : 1.0
            }
        });
    } catch (error) {
        console.error('Error fetching daily queue:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Records a review and updates the spaced repetition metrics.
 */
const submitReview = async (req, res) => {
    try {
        const { itemId, difficultyRating } = req.body;
        // const userId = req.user.id;

        if (!itemId || !difficultyRating || difficultyRating < 1 || difficultyRating > 5) {
            return res.status(400).json({ success: false, message: 'Valid itemId and difficultyRating (1-5) are required.' });
        }

        // Mock fetching current item state
        const currentItem = {
            interval: 3,
            repetitions: 2,
            easeFactor: 2.5,
            memoryStrength: 3.0,
            lastReviewDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        };

        const updatedMetrics = forgettingCurveService.updateSpacedRepetitionMetrics(currentItem, difficultyRating);

        // Mock saving to database
        // await ReviewLog.create({ userId, itemId, difficultyRating, ...updatedMetrics });
        // await Flashcard.update(updatedMetrics, { where: { id: itemId, userId } });

        res.status(200).json({
            success: true,
            data: {
                itemId,
                ...updatedMetrics,
                message: 'Review logged and schedule updated successfully.'
            }
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Fetches historical analytics for the forgetting curve visualization.
 */
const getForgettingCurveAnalytics = async (req, res) => {
    try {
        // Mock historical data for chart rendering
        const analyticsData = {
            predictedCurve: [
                { days: 0, retention: 1.0 },
                { days: 1, retention: 0.95 },
                { days: 3, retention: 0.85 },
                { days: 7, retention: 0.70 },
                { days: 14, retention: 0.55 },
                { days: 30, retention: 0.40 }
            ],
            actualPerformance: [
                { days: 0, retention: 1.0 },
                { days: 1, retention: 0.98 },
                { days: 3, retention: 0.90 },
                { days: 7, retention: 0.88 },
                { days: 14, retention: 0.85 }
            ]
        };

        res.status(200).json({ success: true, data: analyticsData });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getDailyQueue,
    submitReview,
    getForgettingCurveAnalytics,
};

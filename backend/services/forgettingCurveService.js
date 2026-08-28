/**
 * @fileoverview Service for calculating predictive forgetting curves and spaced repetition scheduling.
 * Implements an enhanced SM-2 algorithm combined with Ebbinghaus forgetting curve modeling.
 */

/**
 * Calculates the retention probability based on the Ebbinghaus forgetting curve.
 * Formula: R = e^(-t/S), where t is time elapsed and S is memory strength.
 * 
 * @param {number} timeElapsedDays - Days since the last review.
 * @param {number} memoryStrength - Calculated strength of the memory (based on past performance).
 * @returns {number} Retention probability between 0 and 1.
 */
function calculateRetentionProbability(timeElapsedDays, memoryStrength) {
    if (memoryStrength <= 0) return 0;
    const retention = Math.exp(-timeElapsedDays / memoryStrength);
    return Math.max(0, Math.min(1, retention));
}

/**
 * Updates the memory strength and next review interval based on user feedback (SM-2 algorithm variant).
 * 
 * @param {Object} cardData - Current state of the flashcard/topic.
 * @param {number} difficultyRating - User rating from 1 (hard) to 5 (easy).
 * @returns {Object} Updated card data with new interval and strength.
 */
function updateSpacedRepetitionMetrics(cardData, difficultyRating) {
    let { interval, repetitions, easeFactor, memoryStrength } = cardData;

    // Reset if failed (rating < 3)
    if (difficultyRating < 3) {
        repetitions = 0;
        interval = 1;
    } else {
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
    }

    // Update ease factor (minimum 1.3)
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - difficultyRating) * (0.08 + (5 - difficultyRating) * 0.02)));

    // Recalculate memory strength based on new interval and ease factor
    memoryStrength = interval * (easeFactor / 2.5);

    return {
        interval,
        repetitions,
        easeFactor,
        memoryStrength,
        nextReviewDate: new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString(),
    };
}

/**
 * Generates a daily review queue prioritizing items below the 90% retention threshold.
 * 
 * @param {Array} userItems - Array of user's flashcards/topics with metadata.
 * @returns {Array} Sorted queue of items needing review.
 */
function generateDailyReviewQueue(userItems) {
    const now = Date.now();
    const threshold = 0.90;

    return userItems
        .map((item) => {
            const lastReview = new Date(item.lastReviewDate).getTime();
            const timeElapsedDays = (now - lastReview) / (1000 * 60 * 60 * 24);
            const retentionProb = calculateRetentionProbability(timeElapsedDays, item.memoryStrength);

            return {
                ...item,
                timeElapsedDays: Math.round(timeElapsedDays * 10) / 10,
                retentionProbability: Math.round(retentionProb * 100) / 100,
                isDue: retentionProb < threshold || timeElapsedDays >= item.interval,
            };
        })
        .filter((item) => item.isDue)
        .sort((a, b) => a.retentionProbability - b.retentionProbability); // Lowest retention first
}

module.exports = {
    calculateRetentionProbability,
    updateSpacedRepetitionMetrics,
    generateDailyReviewQueue,
};

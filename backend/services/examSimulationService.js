/**
 * @fileoverview Service for calculating exam analytics, time-tracking, and proctoring integrity scores.
 */

/**
 * Calculates time-management efficiency and proctoring integrity based on exam logs.
 * 
 * @param {Array} questionLogs - Array of { questionId, timeSpentSeconds, isCorrect }.
 * @param {number} totalFocusLossEvents - Number of tab switches or window blur events.
 * @param {number} totalExamDurationSeconds - Total time taken for the exam.
 * @returns {Object} Analytics report.
 */
function generateExamAnalytics(questionLogs, totalFocusLossEvents, totalExamDurationSeconds) {
    if (questionLogs.length === 0) {
        return { error: 'No question logs provided' };
    }

    const totalQuestions = questionLogs.length;
    const correctAnswers = questionLogs.filter(q => q.isCorrect).length;
    const accuracy = (correctAnswers / totalQuestions) * 100;

    const avgTimePerQuestion = totalExamDurationSeconds / totalQuestions;
    const timeManagementScore = Math.max(0, 100 - (avgTimePerQuestion > 60 ? (avgTimePerQuestion - 60) * 0.5 : 0));

    // Proctoring integrity: starts at 100, deducts 15 points per focus loss event
    const integrityScore = Math.max(0, 100 - (totalFocusLossEvents * 15));

    // Topic accuracy (mocked grouping)
    const topicPerformance = {
        'Algorithms': { attempted: 5, correct: 4, accuracy: 80 },
        'Data Structures': { attempted: 5, correct: 3, accuracy: 60 }
    };

    return {
        overallAccuracy: Math.round(accuracy),
        avgTimePerQuestion: Math.round(avgTimePerQuestion),
        timeManagementScore: Math.round(timeManagementScore),
        integrityScore: Math.round(integrityScore),
        focusLossEvents: totalFocusLossEvents,
        topicPerformance,
        totalDuration: totalExamDurationSeconds
    };
}

module.exports = {
    generateExamAnalytics,
};

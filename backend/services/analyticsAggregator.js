const { getSyllabusTopics, getStudentQuizHistory } = require('../models/analyticsModel');

/**
 * Computes combined metrics of syllabus weightage, question density, and student accuracy.
 */
async function computeWeightageMatrix(userId, subjectId) {
  // 1. Fetch structural topic metadata definitions (Weightage, total DB questions)
  const topics = await getSyllabusTopics(subjectId);
  
  // 2. Fetch student performance history logs for the current subject
  const quizHistory = await getStudentQuizHistory(userId, subjectId);

  return topics.map(topic => {
    // Filter and compute student accuracy for this specific topic
    const topicLogs = quizHistory.filter(log => log.topicId === topic.id);
    let masteryLevel = 0.0; // Default baseline mastery if no quizzes have been attempted

    if (topicLogs.length > 0) {
      const totalCorrect = topicLogs.reduce((sum, log) => sum + (log.correctCount || 0), 0);
      const totalAttempted = topicLogs.reduce((sum, log) => sum + (log.attemptedCount || 0), 0);
      masteryLevel = totalAttempted > 0 ? parseFloat(((totalCorrect / totalAttempted) * 100).toFixed(2)) : 0.0;
    }

    const weightage = topic.examWeightagePercent || 0.0; // Range: 0% to 20%
    const totalQuestions = topic.totalQuestionsInDb || 5;

    // 3. Quadrant Prioritization Strategy Mapping Matrix
    let priorityZone = 'LOW_YIELD';
    let colorHex = '#94a3b8'; // Default Slate color for neutral quadrants

    if (weightage >= 10.0) {
      if (masteryLevel < 50.0) {
        priorityZone = 'CRITICAL_DANGER_ZONE';
        colorHex = '#ef4444'; // Red (High Weight, Low Mastery -> Immediate Priority)
      } else {
        priorityZone = 'MASTERED_HIGH_YIELD';
        colorHex = '#10b981'; // Green (High Weight, High Mastery -> Maintenance)
      }
    } else {
      if (masteryLevel < 50.0) {
        priorityZone = 'GROWTH_OPPORTUNITY';
        colorHex = '#f59e0b'; // Amber (Low Weight, Low Mastery -> Gradual Study)
      }
    }

    return {
      topicId: topic.id,
      topicName: topic.title,
      xAxisWeightage: weightage,
      yAxisMastery: masteryLevel,
      bubbleSizeRadius: totalQuestions,
      priorityZone,
      color: colorHex
    };
  });
}

module.exports = { computeWeightageMatrix };

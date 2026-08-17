const { Topic, Progress, Quiz, QuizAttempt, Flashcard, StudyPlan, Subject } = require('../models');

/**
 * Calculates dynamic readiness metrics for a user in a specific subject
 * @param {string} userId
 * @param {string} subjectId
 * @returns {Promise<{ syllabusCoverage: number, quizAccuracy: number, memoryRetention: number, studyVelocity: number, readinessScore: number }>}
 */
const calculateSubjectReadiness = async (userId, subjectId) => {
  // 1. Syllabus Coverage (30% weight)
  const topics = await Topic.findAll({ where: { subject: subjectId } });
  let syllabusCoverage = 0;
  if (topics.length > 0) {
    const topicIds = topics.map((t) => t.id);
    const progresses = await Progress.findAll({ where: { user: userId, topic: topicIds } });
    const totalPercentage = progresses.reduce((sum, p) => sum + (p.completionPercentage || 0), 0);
    syllabusCoverage = Math.round(totalPercentage / topics.length);
  }

  // 2. Quiz Accuracy (30% weight)
  const attempts = await QuizAttempt.findAll({
    where: { user: userId },
    include: [
      {
        model: Quiz,
        as: 'quizRef',
        where: { subject: subjectId },
      },
    ],
  });
  let quizAccuracy = 0;
  if (attempts.length > 0) {
    let totalCorrect = 0;
    let totalQs = 0;
    attempts.forEach((a) => {
      totalCorrect += (a.score || 0);
      totalQs += (a.totalQuestions || 1);
    });
    quizAccuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
  }

  // 3. Spaced Repetition Memory Retention (25% weight)
  const flashcards = await Flashcard.findAll({ where: { user: userId, subject: subjectId } });
  let memoryRetention = 0;
  if (flashcards.length > 0) {
    const totalStability = flashcards.reduce((sum, f) => {
      // E-factor percentage (min 1.3, max 3.0) mapped to 0-100%
      const efactorScore = ((f.efactor - 1.3) / (3.0 - 1.3)) * 100;
      // Repetitions boost memory stability
      const repScore = Math.min(100, (f.repetitions || 0) * 20);
      return sum + (efactorScore * 0.6 + repScore * 0.4);
    }, 0);
    memoryRetention = Math.round(totalStability / flashcards.length);
  }

  // 4. Study Plan Schedule Velocity (15% weight)
  const studyPlan = await StudyPlan.findOne({ where: { user: userId, status: 'active' } });
  let studyVelocity = 50; // default middle metric if no active study plan
  if (studyPlan && studyPlan.dailyGoals && studyPlan.dailyGoals.length > 0) {
    const completed = studyPlan.dailyGoals.filter((g) => g.completed).length;
    studyVelocity = Math.round((completed / studyPlan.dailyGoals.length) * 100);
  }

  // Calculate overall Readiness Score (ERI)
  const ERI = Math.round(
    (syllabusCoverage * 0.30) +
    (quizAccuracy * 0.30) +
    (memoryRetention * 0.25) +
    (studyVelocity * 0.15)
  );

  return {
    syllabusCoverage,
    quizAccuracy,
    memoryRetention,
    studyVelocity,
    readinessScore: ERI,
  };
};

module.exports = {
  calculateSubjectReadiness,
};

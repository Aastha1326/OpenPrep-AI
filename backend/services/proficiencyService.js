const { Op } = require('sequelize');
const QuizAttempt = require('../models/QuizAttempt');

/**
 * Calculates user proficiency for a specific topic/subject.
 * Proficiency = (CorrectAnswersRatio * 0.7) + (SpeedFactor * 0.3)
 */
exports.calculateTopicProficiency = async (userId, subjectId, topicId = null) => {
  const where = { user: userId, quiz: { [Op.in]: (await require('../models/Quiz').findAll({ where: { subject: subjectId } })).map(q => q.id) } };
  if (topicId) {
    where.quiz = { [Op.in]: (await require('../models/Quiz').findAll({ where: { topic: topicId } })).map(q => q.id) };
  }

  const attempts = await QuizAttempt.findAll({ where });
  if (attempts.length === 0) return 0.5; // Default neutral proficiency

  let totalCorrect = 0;
  let totalQuestions = 0;
  let totalSpeedScore = 0;

  attempts.forEach(att => {
    totalCorrect += (att.score / 100) * att.totalQuestions;
    totalQuestions += att.totalQuestions;
    
    // Speed factor: assume 30s per question expected
    const expectedTime = att.totalQuestions * 30000;
    const speedRatio = Math.min(1, expectedTime / Math.max(att.timeSpent, 1000));
    totalSpeedScore += speedRatio;
  });

  const accuracyRatio = totalCorrect / totalQuestions;
  const speedFactor = totalSpeedScore / attempts.length;

  const proficiency = (accuracyRatio * 0.7) + (speedFactor * 0.3);
  return Math.min(Math.max(proficiency, 0), 1);
};

exports.getDifficultyLevel = (proficiency) => {
  if (proficiency < 0.4) return 'Easy';
  if (proficiency < 0.7) return 'Medium';
  return 'Hard';
};

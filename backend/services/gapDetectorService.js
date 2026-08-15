const { Op } = require('sequelize');
const { SyllabusTopic, Note, Topic, Quiz, QuizAttempt } = require('../models');

/**
 * Cross-references syllabus topics against user's notes and quiz attempts to detect coverage gaps
 * @param {string} userId
 * @param {string} syllabusId
 * @returns {Promise<{ coveragePercentage: number, topics: object[] }>}
 */
const analyzeSyllabusGaps = async (userId, syllabusId) => {
  const topics = await SyllabusTopic.findAll({ where: { syllabusId } });
  const results = [];
  let coveredCount = 0;
  let partialCount = 0;

  for (const topic of topics) {
    // 1. Try finding a matching note by user
    const note = await Note.findOne({
      where: {
        user: userId,
        [Op.or]: [
          { title: { [Op.iLike]: `%${topic.title}%` } },
          { content: { [Op.iLike]: `%${topic.title}%` } },
        ],
      },
    });

    // 2. Try finding matching database topic and corresponding quiz attempts
    const dbTopic = await Topic.findOne({
      where: {
        user: userId,
        name: { [Op.iLike]: `%${topic.title}%` },
      },
    });

    let avgQuizScore = null;
    if (dbTopic) {
      const quizzes = await Quiz.findAll({ where: { topic: dbTopic.id } });
      const quizIds = quizzes.map((q) => q.id);
      if (quizIds.length > 0) {
        const attempts = await QuizAttempt.findAll({
          where: { user: userId, quiz: quizIds },
        });
        if (attempts.length > 0) {
          const totalCorrect = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
          const totalQs = attempts.reduce((sum, a) => sum + (a.totalQuestions || 1), 0);
          avgQuizScore = totalQs > 0 ? (totalCorrect / totalQs) * 100 : null;
        }
      }
    }

    // 3. Determine Coverage Status
    let status = 'Unstudied Gap'; // default: Red
    if (note && avgQuizScore !== null && avgQuizScore >= 70) {
      status = 'Covered'; // Green
      coveredCount++;
    } else if (note || (avgQuizScore !== null && avgQuizScore >= 50)) {
      status = 'Partially Covered'; // Yellow
      partialCount++;
    }

    // Update in database
    topic.coverageStatus = status;
    if (note) {
      topic.linkedNoteId = note.id;
    }
    await topic.save();

    results.push({
      id: topic.id,
      moduleName: topic.moduleName,
      title: topic.title,
      subtopics: topic.subtopics,
      weightage: topic.weightage,
      coverageStatus: status,
      linkedNoteId: note ? note.id : null,
      avgQuizScore: avgQuizScore ? Math.round(avgQuizScore) : null,
    });
  }

  // ERI overall coverage percentage formula
  const totalTopics = topics.length;
  const coveragePercentage = totalTopics > 0 
    ? Math.round(((coveredCount + (partialCount * 0.5)) / totalTopics) * 100) 
    : 0;

  return {
    coveragePercentage,
    topics: results,
  };
};

module.exports = {
  analyzeSyllabusGaps,
};

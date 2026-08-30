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
  if (topics.length === 0) {
    return { coveragePercentage: 0, topics: [] };
  }

  // Fetch the user's notes and quiz history once, up front, instead of
  // issuing up to 4 queries per syllabus topic (previously N+1).
  const [notes, dbTopics] = await Promise.all([
    Note.findAll({ where: { user: userId }, attributes: ['id', 'title', 'content'] }),
    Topic.findAll({ where: { user: userId }, attributes: ['id', 'name'] }),
  ]);

  const dbTopicIds = dbTopics.map((t) => t.id);
  const quizzes = dbTopicIds.length
    ? await Quiz.findAll({ where: { topic: dbTopicIds }, attributes: ['id', 'topic'] })
    : [];
  const quizIdsByTopic = new Map();
  quizzes.forEach((q) => {
    if (!quizIdsByTopic.has(q.topic)) quizIdsByTopic.set(q.topic, []);
    quizIdsByTopic.get(q.topic).push(q.id);
  });

  const allQuizIds = quizzes.map((q) => q.id);
  const attempts = allQuizIds.length
    ? await QuizAttempt.findAll({ where: { user: userId, quiz: allQuizIds }, attributes: ['quiz', 'score', 'totalQuestions'] })
    : [];
  const attemptsByQuiz = new Map();
  attempts.forEach((a) => {
    if (!attemptsByQuiz.has(a.quiz)) attemptsByQuiz.set(a.quiz, []);
    attemptsByQuiz.get(a.quiz).push(a);
  });

  const results = [];
  const topicsToUpdate = [];
  let coveredCount = 0;
  let partialCount = 0;

  for (const topic of topics) {
    const lowerTitle = topic.title.toLowerCase();
    const note = notes.find(
      (n) => n.title?.toLowerCase().includes(lowerTitle) || n.content?.toLowerCase().includes(lowerTitle)
    );
    const dbTopic = dbTopics.find((t) => t.name?.toLowerCase().includes(lowerTitle));

    let avgQuizScore = null;
    if (dbTopic) {
      const quizIds = quizIdsByTopic.get(dbTopic.id) || [];
      const topicAttempts = quizIds.flatMap((qid) => attemptsByQuiz.get(qid) || []);
      if (topicAttempts.length > 0) {
        const totalCorrect = topicAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
        const totalQs = topicAttempts.reduce((sum, a) => sum + (a.totalQuestions || 1), 0);
        avgQuizScore = totalQs > 0 ? (totalCorrect / totalQs) * 100 : null;
      }
    }

    let status = 'Unstudied Gap'; // default: Red
    if (note && avgQuizScore !== null && avgQuizScore >= 70) {
      status = 'Covered'; // Green
      coveredCount++;
    } else if (note || (avgQuizScore !== null && avgQuizScore >= 50)) {
      status = 'Partially Covered'; // Yellow
      partialCount++;
    }

    if (topic.coverageStatus !== status || (note && topic.linkedNoteId !== note.id)) {
      topic.coverageStatus = status;
      if (note) topic.linkedNoteId = note.id;
      topicsToUpdate.push(topic);
    }

    results.push({
      id: topic.id,
      moduleName: topic.moduleName,
      title: topic.title,
      subtopics: topic.subtopics,
      weightage: topic.weightage,
      coverageStatus: status,
      linkedNoteId: note ? note.id : topic.linkedNoteId,
      avgQuizScore: avgQuizScore ? Math.round(avgQuizScore) : null,
    });
  }

  await Promise.all(topicsToUpdate.map((t) => t.save()));

  const totalTopics = topics.length;
  const coveragePercentage = Math.round(((coveredCount + (partialCount * 0.5)) / totalTopics) * 100);

  return {
    coveragePercentage,
    topics: results,
  };
};
module.exports = {
  analyzeSyllabusGaps,
};

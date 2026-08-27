const { User, LearningPath, Topic, Subject, QuizAttempt, Note, PYQ } = require('../models');
const {
  resolveLearningOrder,
} = require('./skillDependencyService');
/**
 * Computes topic mastery and accuracy for a given user.
 *
 * @param {string} userId
 * @returns {Promise<Map<string, { accuracy: number, status: string, totalAttempts: number }>>}
 */
async function computeTopicMastery(userId) {
  const masteryMap = new Map();

  try {
    const attempts = await QuizAttempt.findAll({
      where: { user: userId },
      order: [['createdAt', 'DESC']],
    });

    if (!attempts || attempts.length === 0) {
      return masteryMap;
    }

    const topicStats = new Map();

    for (const attempt of attempts) {
      const score = Number(attempt.score) || 0;

      // Handle explicit weak / strong topics array if present
      if (Array.isArray(attempt.weakTopics)) {
        for (const topicId of attempt.weakTopics) {
          const stats = topicStats.get(topicId) || { correct: 0, total: 0 };
          stats.total += 1;
          topicStats.set(topicId, stats);
        }
      }

      if (Array.isArray(attempt.strongTopics)) {
        for (const topicId of attempt.strongTopics) {
          const stats = topicStats.get(topicId) || { correct: 0, total: 0 };
          stats.correct += 1;
          stats.total += 1;
          topicStats.set(topicId, stats);
        }
      }

      // If generic attempt score exists without topic arrays, attribute to overall
      if ((!attempt.weakTopics || attempt.weakTopics.length === 0) && (!attempt.strongTopics || attempt.strongTopics.length === 0)) {
        const stats = topicStats.get('general') || { correct: 0, total: 0 };
        stats.correct += (score / 100);
        stats.total += 1;
        topicStats.set('general', stats);
      }
    }

    for (const [topicId, stats] of topicStats.entries()) {
      const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      let status = 'developing';
      if (accuracy >= 80) status = 'mastered';
      else if (accuracy < 50) status = 'weak';

      masteryMap.set(topicId, {
        accuracy,
        status,
        totalAttempts: stats.total,
      });
    }
  } catch (error) {
    console.error('Error computing topic mastery:', error);
  }

  return masteryMap;
}

/**
 * Detects knowledge gaps (accuracy < 50% or unattempted topics) ranked by relevance & difficulty.
 *
 * @param {string} userId
 * @param {string} [goal]
 * @returns {Promise<Array<Object>>}
 */
async function detectGaps(userId, goal = 'General Exam Prep') {
  const masteryMap = await computeTopicMastery(userId);

  let topics = [];
  try {
    topics = await Topic.findAll({
      where: { user: userId },
      include: [{ model: Subject, as: 'subjectRef', attributes: ['name'] }],
      order: [['weightage', 'DESC'], ['name', 'ASC']],
    });
  } catch (_err) {
    // Graceful fallback if user has no explicit topics created
    topics = [];
  }

  if (topics.length === 0) {
    // Synthesize fallback baseline topics if none exist in DB
    topics = [
      { id: 'synth-1', name: 'Core Foundations & Fundamentals', subjectRef: { name: 'Basics' }, weightage: 5 },
      { id: 'synth-2', name: 'Intermediate Problem Solving', subjectRef: { name: 'Practice' }, weightage: 4 },
      { id: 'synth-3', name: 'Advanced Exam Strategy & PYQs', subjectRef: { name: 'Exams' }, weightage: 3 },
    ];
  }

  const gapTopics = [];

  for (const topic of topics) {
    const topicId = topic.id;
    const mastery = masteryMap.get(topicId);

    let accuracy = mastery ? mastery.accuracy : 0;
    let masteryStatus = mastery ? mastery.status : 'unattempted';

    // Prioritize weak gaps (< 50%) and unattempted topics
    let gapScore = 0;
    if (masteryStatus === 'weak') gapScore = 100 - accuracy;
    else if (masteryStatus === 'unattempted') gapScore = 75;
    else if (masteryStatus === 'developing') gapScore = 40;
    else gapScore = 10; // Mastered

    gapTopics.push({
      topicId,
      topicName: topic.name,
      subjectName: topic.subjectRef?.name || 'General Subject',
      accuracy,
      masteryStatus,
      weightage: topic.weightage || 1,
      gapScore,
    });
  }

  // Rank by gapScore (highest gap / urgency first)
  gapTopics.sort((a, b) => b.gapScore - a.gapScore);

  return gapTopics;
}

/**
 * Generates an adaptive learning path with realistic target dates and curated resources.
 *
 * @param {string} userId
 * @param {string} [goal='General Mastery & Exam Prep']
 * @returns {Promise<Object>} Generated LearningPath record.
 */
async function generatePath(userId, goal = 'General Mastery & Exam Prep') {
const rankedGaps = await detectGaps(userId, goal);

const dependencyOrderedGaps =
  await resolveLearningOrder(userId, rankedGaps);
  // Fetch curated user notes / PYQs to attach as recommended resources
  let userNotes = [];
  try {
    userNotes = await Note.findAll({ where: { user: userId }, limit: 5 });
  } catch (_e) {
    userNotes = [];
  }

  let userPYQs = [];
  try {
    userPYQs = await PYQ.findAll({ where: { user: userId }, limit: 5 });
  } catch (_e) {
    userPYQs = [];
  }

  const currentDate = new Date();
  const pathItems = [];

for (let i = 0; i < dependencyOrderedGaps.length; i++) {
  const gap = dependencyOrderedGaps[i];
    // Assign realistic target date: 2 days per topic sequentially
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() + (i + 1) * 2);

    // Build curated resources
    const recommendedResources = [];

    if (userNotes[i % userNotes.length]) {
      const note = userNotes[i % userNotes.length];
      recommendedResources.push({
        title: `Note: ${note.title}`,
        type: 'note',
        url: `/notes/collaborative/${note.id}`,
        durationMinutes: 15,
      });
    }

    if (userPYQs[i % userPYQs.length]) {
      const pyq = userPYQs[i % userPYQs.length];
      recommendedResources.push({
        title: `PYQ: ${pyq.title || 'Exam Paper'}`,
        type: 'pdf',
        url: pyq.fileUrl || '/pyqs',
        durationMinutes: 30,
      });
    }

    recommendedResources.push({
      title: `Practice Quiz - ${gap.topicName}`,
      type: 'quiz',
      url: `/quiz/session?topic=${encodeURIComponent(gap.topicName)}`,
      durationMinutes: 20,
    });

    pathItems.push({
      itemId: `item-${i + 1}-${Date.now()}`,
      topicId: gap.topicId,
      topicName: gap.topicName,
      subjectName: gap.subjectName,
      accuracy: gap.accuracy,
      masteryStatus: gap.masteryStatus,
      status: i === 0 ? 'in_progress' : 'pending',
      targetDate: targetDate.toISOString().split('T')[0],
      recommendedResources,
    });
  }

  const completedCount = pathItems.filter((item) => item.status === 'completed').length;
  const overallProgress = pathItems.length > 0 ? Math.round((completedCount / pathItems.length) * 100) : 0;

  // Persist to LearningPath table
  const newPath = await LearningPath.create({
    userId,
    goal,
    pathItems,
    overallProgress,
    status: 'active',
  });

  // Link to User model
  const user = await User.findByPk(userId);
  if (user) {
    user.currentLearningPathId = newPath.id;
    await user.save().catch(() => {});
  }

  return newPath;
}

module.exports = {
  computeTopicMastery,
  detectGaps,
  generatePath,
};

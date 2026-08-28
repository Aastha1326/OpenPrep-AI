const { Op, fn, col, literal } = require('sequelize');
const Topic = require('../models/Topic');
const Subject = require('../models/Subject');
const Progress = require('../models/Progress');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const WeaknessReport = require('../models/WeaknessReport');
const geminiService = require('./geminiService');

/**
 * Confidence scoring — more attempts and recent attempts increase confidence.
 * Uses a logarithmic scale so early attempts have outsized impact.
 */
const calculateConfidence = (attemptCount, daysSinceLastAttempt) => {
  const volumeFactor = Math.min(1, Math.log2(attemptCount + 1) / 7);
  const recencyFactor = Math.max(0, 1 - daysSinceLastAttempt / 90);
  return Math.round((volumeFactor * 0.6 + recencyFactor * 0.4) * 100) / 100;
};

/**
 * Improvement velocity — positive means getting better, negative means declining.
 * Computed as the linear slope of scores over time (normalized to -1..1).
 */
const calculateImprovementVelocity = (scoresWithDates) => {
  if (scoresWithDates.length < 2) return 0;

  const sorted = [...scoresWithDates].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const n = sorted.length;
  const xValues = sorted.map((_, i) => i);
  const yValues = sorted.map((s) => s.score);

  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }

  if (denominator === 0) return 0;
  const slope = numerator / denominator;
  return Math.round(Math.max(-1, Math.min(1, slope / 25)) * 100) / 100;
};

/**
 * Classify a topic's status based on its average score.
 */
const classifyTopic = (avgScore) => {
  if (avgScore < 40) return 'Weak';
  if (avgScore < 65) return 'Medium';
  return 'Strong';
};

/**
 * Core analysis — builds a full weakness profile for a user.
 * Returns per-topic and per-subject breakdowns with confidence and velocity.
 */
exports.buildWeaknessProfile = async (userId) => {
  const [userTopics, userSubjects, allAttempts] = await Promise.all([
    Topic.findAll({ where: { user: userId }, attributes: ['id', 'name', 'subject', 'status', 'weightage'] }),
    Subject.findAll({ where: { user: userId }, attributes: ['id', 'name'] }),
    QuizAttempt.findAll({
      where: { user: userId },
      attributes: ['id', 'quiz', 'score', 'totalQuestions', 'timeSpent', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 500,
    }),
  ]);

  if (userTopics.length === 0) {
    return {
      topics: [],
      subjects: [],
      overallScore: 0,
      weakCount: 0,
      mediumCount: 0,
      strongCount: 0,
      coveragePercentage: 0,
    };
  }

  // Build a map: topicId -> quizIds
  const topicQuizMap = new Map();
  for (const topic of userTopics) {
    topicQuizMap.set(topic.id, []);
  }

  const quizzes = await Quiz.findAll({
    where: { topic: { [Op.in]: userTopics.map((t) => t.id) } },
    attributes: ['id', 'topic', 'subject'],
  });

  for (const quiz of quizzes) {
    const list = topicQuizMap.get(quiz.topic);
    if (list) list.push(quiz.id);
  }

  // Map quiz -> subject
  const quizSubjectMap = new Map();
  for (const quiz of quizzes) {
    quizSubjectMap.set(quiz.id, quiz.subject);
  }

  // Group attempts by quiz
  const attemptsByQuiz = new Map();
  for (const attempt of allAttempts) {
    if (!attemptsByQuiz.has(attempt.quiz)) attemptsByQuiz.set(attempt.quiz, []);
    attemptsByQuiz.get(attempt.quiz).push(attempt);
  }

  // Per-topic analysis
  const now = new Date();
  const topicResults = [];

  for (const topic of userTopics) {
    const quizIds = topicQuizMap.get(topic.id) || [];
    const topicAttempts = quizIds.flatMap((qid) => attemptsByQuiz.get(qid) || []);

    if (topicAttempts.length === 0) {
      topicResults.push({
        topicId: topic.id,
        topicName: topic.name,
        subjectId: topic.subject,
        status: 'Weak',
        avgScore: 0,
        attemptCount: 0,
        confidenceScore: 0,
        improvementVelocity: 0,
        lastAttemptAt: null,
        weightage: topic.weightage || 0,
      });
      continue;
    }

    const totalScore = topicAttempts.reduce((sum, a) => sum + a.score, 0);
    const avgScore = Math.round(totalScore / topicAttempts.length);

    const scoresWithDates = topicAttempts.map((a) => ({
      score: a.score,
      date: a.createdAt,
    }));

    const lastAttempt = topicAttempts[0]; // already sorted DESC
    const daysSinceLast = Math.floor(
      (now - new Date(lastAttempt.createdAt)) / (1000 * 60 * 60 * 24)
    );

    topicResults.push({
      topicId: topic.id,
      topicName: topic.name,
      subjectId: topic.subject,
      status: classifyTopic(avgScore),
      avgScore,
      attemptCount: topicAttempts.length,
      confidenceScore: calculateConfidence(topicAttempts.length, daysSinceLast),
      improvementVelocity: calculateImprovementVelocity(scoresWithDates),
      lastAttemptAt: lastAttempt.createdAt,
      weightage: topic.weightage || 0,
    });
  }

  // Group by subject
  const subjectMap = new Map();
  for (const subject of userSubjects) {
    subjectMap.set(subject.id, { ...subject.toJSON(), topics: [] });
  }

  for (const topic of topicResults) {
    const subjectEntry = subjectMap.get(topic.subjectId);
    if (subjectEntry) {
      subjectEntry.topics.push(topic);
    }
  }

  const subjects = Array.from(subjectMap.values()).map((s) => {
    const topics = s.topics;
    const totalScore = topics.reduce((sum, t) => sum + t.avgScore, 0);
    const avgScore = topics.length > 0 ? Math.round(totalScore / topics.length) : 0;
    return {
      subjectId: s.id,
      subjectName: s.name,
      topics,
      avgScore,
      weakTopics: topics.filter((t) => t.status === 'Weak').length,
      totalTopics: topics.length,
    };
  });

  const weakCount = topicResults.filter((t) => t.status === 'Weak').length;
  const mediumCount = topicResults.filter((t) => t.status === 'Medium').length;
  const strongCount = topicResults.filter((t) => t.status === 'Strong').length;
  const overallScore =
    topicResults.length > 0
      ? Math.round(
          topicResults.reduce((sum, t) => sum + t.avgScore, 0) / topicResults.length
        )
      : 0;
  const coveragePercentage = topicResults.filter((t) => t.attemptCount > 0).length > 0
    ? Math.round(
        (topicResults.filter((t) => t.attemptCount > 0).length /
          topicResults.length) *
          100
      )
    : 0;

  return {
    topics: topicResults,
    subjects,
    overallScore,
    weakCount,
    mediumCount,
    strongCount,
    coveragePercentage,
  };
};

/**
 * Compare current profile to previous report and compute trend + delta.
 */
exports.computeTrend = (currentProfile, previousReport) => {
  if (!previousReport) {
    return { trendDirection: 'stable', comparisonDelta: 0 };
  }

  const delta = currentProfile.overallScore - previousReport.overallScore;
  let trendDirection = 'stable';
  if (delta > 3) trendDirection = 'improving';
  else if (delta < -3) trendDirection = 'declining';

  return { trendDirection, comparisonDelta: Math.round(delta * 100) / 100 };
};

/**
 * Generate AI-powered recommendations for weak topics using Gemini.
 */
exports.generateAIRecommendations = async (userId, weakTopics) => {
  if (weakTopics.length === 0) return [];

  try {
    const weakTopicNames = weakTopics.map((t) => ({
      name: t.topicName,
      avgScore: t.avgScore,
      velocity: t.improvementVelocity,
      weightage: t.weightage,
    }));

    const prompt = `You are an AI study advisor. A student has the following weak topics:
${JSON.stringify(weakTopicNames, null, 2)}

For each topic, generate a specific, actionable recommendation. Return a JSON array with objects containing:
- type: one of "study", "quiz", "review", "focus"
- priority: one of "high", "medium", "low" (high for low scores + high weightage)
- title: short action title
- description: 1-2 sentence actionable advice
- topicName: the topic name
- estimatedMinutes: suggested time investment

Return ONLY the JSON array, no markdown fences.`;

    const result = await geminiService.generateContent(prompt);

    if (typeof result === 'string') {
      const parsed = JSON.parse(result);
      return Array.isArray(parsed) ? parsed : [];
    }
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    // Fallback: generate rule-based recommendations
    return weakTopics.map((t) => ({
      type: t.avgScore < 30 ? 'focus' : t.avgScore < 50 ? 'study' : 'quiz',
      priority: t.weightage > 5 ? 'high' : t.avgScore < 30 ? 'high' : 'medium',
      title: `Improve ${t.topicName}`,
      description: `Your average score is ${t.avgScore}%. ${
        t.improvementVelocity < 0
          ? 'Your performance is declining — prioritize this topic.'
          : 'Keep practicing to push past the threshold.'
      }`,
      topicName: t.topicName,
      estimatedMinutes: t.avgScore < 30 ? 90 : t.avgScore < 50 ? 60 : 30,
    }));
  }
};

/**
 * Create and persist a WeaknessReport snapshot.
 */
exports.createReport = async (userId, profile, aiRecommendations, snapshotType = 'auto') => {
  // Find the most recent previous report for comparison
  const previousReport = await WeaknessReport.findOne({
    where: { user: userId },
    order: [['createdAt', 'DESC']],
  });

  const { trendDirection, comparisonDelta } = exports.computeTrend(profile, previousReport);

  // Build per-subject breakdown for the report
  const subjectBreakdown = profile.subjects.map((s) => ({
    subjectId: s.subjectId,
    subjectName: s.subjectName,
    avgScore: s.avgScore,
    weakTopics: s.weakTopics,
    totalTopics: s.totalTopics,
  }));

  const report = await WeaknessReport.create({
    user: userId,
    subject: null,
    subjectName: null,
    topicBreakdown: profile.topics,
    overallScore: profile.overallScore,
    weakCount: profile.weakCount,
    mediumCount: profile.mediumCount,
    strongCount: profile.strongCount,
    coveragePercentage: profile.coveragePercentage,
    aiRecommendations,
    trendDirection,
    comparisonDelta,
    snapshotType,
  });

  return report;
};

/**
 * Full pipeline — build profile, generate recommendations, save report.
 */
exports.runFullAnalysis = async (userId, snapshotType = 'auto') => {
  const profile = await exports.buildWeaknessProfile(userId);

  const weakTopics = profile.topics.filter((t) => t.status === 'Weak');
  const aiRecommendations = await exports.generateAIRecommendations(userId, weakTopics);

  const report = await exports.createReport(userId, profile, aiRecommendations, snapshotType);

  return {
    report,
    profile,
  };
};

/**
 * Get trend data — returns historical overall scores for charting.
 */
exports.getTrendData = async (userId, limit = 30) => {
  const reports = await WeaknessReport.findAll({
    where: { user: userId },
    order: [['createdAt', 'ASC']],
    limit,
    attributes: ['id', 'overallScore', 'weakCount', 'mediumCount', 'strongCount', 'trendDirection', 'comparisonDelta', 'createdAt', 'snapshotType'],
  });

  return reports;
};

/**
 * Get a specific weakness report by ID.
 */
exports.getReportById = async (reportId, userId) => {
  return WeaknessReport.findOne({
    where: { id: reportId, user: userId },
  });
};

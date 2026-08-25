const { Op, fn, col } = require('sequelize');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Topic = require('../models/Topic');
const Subject = require('../models/Subject');

/**
 * Attempt History & Trend Graphs — aggregates quiz attempt data
 * for visual progress tracking, topic score trends, and performance analytics.
 */

/**
 * Get full attempt history for a user with pagination and filtering.
 */
exports.getAttemptHistory = async (userId, filters = {}) => {
  const { subjectId, topicId, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  // Build quiz filter
  const quizWhere = {};
  if (subjectId) quizWhere.subject = subjectId;
  if (topicId) quizWhere.topic = topicId;

  const quizIds = (await Quiz.findAll({ where: quizWhere, attributes: ['id'] })).map((q) => q.id);

  const where = { user: userId };
  if (quizIds.length > 0) where.quiz = { [Op.in]: quizIds };

  const { rows: attempts, count: total } = await QuizAttempt.findAndCountAll({
    where,
    include: [{
      model: Quiz,
      as: 'quizRef',
      attributes: ['id', 'title', 'subject', 'topic'],
      include: [
        { model: Subject, as: 'subjectRef', attributes: ['id', 'name'] },
        { model: Topic, as: 'topicRef', attributes: ['id', 'name'] },
      ],
    }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  const enriched = attempts.map((a) => ({
    id: a.id,
    score: a.score,
    totalQuestions: a.totalQuestions,
    timeSpent: a.timeSpent,
    createdAt: a.createdAt,
    quiz: a.quizRef ? {
      id: a.quizRef.id,
      title: a.quizRef.title,
      subject: a.quizRef.subjectRef ? { id: a.quizRef.subjectRef.id, name: a.quizRef.subjectRef.name } : null,
      topic: a.quizRef.topicRef ? { id: a.quizRef.topicRef.id, name: a.quizRef.topicRef.name } : null,
    } : null,
  }));

  return {
    attempts: enriched,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get score trend data over time — grouped by day/week for charting.
 */
exports.getScoreTrends = async (userId, filters = {}) => {
  const { subjectId, groupBy = 'day', limit = 60 } = filters;

  const where = { user: userId };
  if (subjectId) {
    const quizIds = (await Quiz.findAll({ where: { subject: subjectId }, attributes: ['id'] })).map((q) => q.id);
    if (quizIds.length === 0) return { trends: [], summary: { avgScore: 0, totalAttempts: 0 } };
    where.quiz = { [Op.in]: quizIds };
  }

  const attempts = await QuizAttempt.findAll({
    where,
    attributes: ['score', 'totalQuestions', 'timeSpent', 'createdAt'],
    order: [['createdAt', 'ASC']],
    limit: 500,
  });

  if (attempts.length === 0) return { trends: [], summary: { avgScore: 0, totalAttempts: 0 } };

  // Group by time period
  const groups = {};
  for (const a of attempts) {
    const date = new Date(a.createdAt);
    let key;
    if (groupBy === 'week') {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      key = startOfWeek.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      key = date.toISOString().split('T')[0];
    }

    if (!groups[key]) groups[key] = { scores: [], timeSpent: [], totalQ: 0 };
    groups[key].scores.push(a.score);
    groups[key].timeSpent.push(a.timeSpent || 0);
    groups[key].totalQ += a.totalQuestions;
  }

  const trends = Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([period, data]) => ({
      period,
      avgScore: Math.round(data.scores.reduce((s, v) => s + v, 0) / data.scores.length),
      attemptCount: data.scores.length,
      avgTimeSpent: Math.round(data.timeSpent.reduce((s, v) => s + v, 0) / data.timeSpent.length / 1000),
      totalQuestions: data.totalQ,
      minScore: Math.min(...data.scores),
      maxScore: Math.max(...data.scores),
    }));

  const allScores = attempts.map((a) => a.score);
  const summary = {
    avgScore: Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length),
    totalAttempts: attempts.length,
    bestScore: Math.max(...allScores),
    worstScore: Math.min(...allScores),
    avgTimeSpent: Math.round(attempts.reduce((s, a) => s + (a.timeSpent || 0), 0) / attempts.length / 1000),
  };

  return { trends, summary };
};

/**
 * Get per-topic progress — how each topic's score has changed over time.
 */
exports.getTopicProgress = async (userId, subjectId = null) => {
  const quizWhere = subjectId ? { subject: subjectId } : {};
  const quizIds = (await Quiz.findAll({ where: quizWhere, attributes: ['id', 'topic'] })).map((q) => q.id);

  if (quizIds.length === 0) return { topics: [] };

  const quizTopicMap = {};
  (await Quiz.findAll({ where: quizWhere, attributes: ['id', 'topic'] })).forEach((q) => {
    quizTopicMap[q.id] = q.topic;
  });

  const attempts = await QuizAttempt.findAll({
    where: { user: userId, quiz: { [Op.in]: quizIds } },
    attributes: ['quiz', 'score', 'createdAt'],
    order: [['createdAt', 'ASC']],
  });

  // Group by topic
  const topicMap = {};
  for (const a of attempts) {
    const topicId = quizTopicMap[a.quiz];
    if (!topicId) continue;
    if (!topicMap[topicId]) topicMap[topicId] = { scores: [], dates: [] };
    topicMap[topicId].scores.push(a.score);
    topicMap[topicId].dates.push(a.createdAt);
  }

  // Fetch topic names
  const topicIds = Object.keys(topicMap);
  const topics = await Topic.findAll({ where: { id: { [Op.in]: topicIds } }, attributes: ['id', 'name', 'status'] });
  const topicNameMap = {};
  topics.forEach((t) => { topicNameMap[t.id] = { name: t.name, status: t.status }; });

  const result = topicIds.map((id) => {
    const data = topicMap[id];
    const scores = data.scores;
    const name = topicNameMap[id]?.name || 'Unknown';
    const status = topicNameMap[id]?.status || 'Medium';

    // Calculate improvement velocity
    const n = scores.length;
    let velocity = 0;
    if (n >= 2) {
      const recent = scores.slice(-5);
      const earlier = scores.slice(0, Math.max(1, Math.floor(n / 2)));
      const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
      const earlierAvg = earlier.reduce((s, v) => s + v, 0) / earlier.length;
      velocity = Math.round((recentAvg - earlierAvg) * 10) / 10;
    }

    return {
      topicId: id,
      topicName: name,
      status,
      totalAttempts: n,
      avgScore: Math.round(scores.reduce((s, v) => s + v, 0) / n),
      latestScore: scores[scores.length - 1],
      bestScore: Math.max(...scores),
      firstScore: scores[0],
      velocity,
      trend: velocity > 5 ? 'improving' : velocity < -5 ? 'declining' : 'stable',
    };
  });

  return { topics: result.sort((a, b) => b.avgScore - a.avgScore) };
};

/**
 * Get performance summary — overall stats for the dashboard.
 */
exports.getPerformanceSummary = async (userId) => {
  const attempts = await QuizAttempt.findAll({
    where: { user: userId },
    attributes: ['score', 'totalQuestions', 'timeSpent', 'createdAt'],
    order: [['createdAt', 'DESC']],
  });

  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      avgScore: 0,
      bestScore: 0,
      streak: 0,
      recentTrend: 'stable',
      weeklyAttempts: 0,
      monthlyAttempts: 0,
      totalStudyTime: 0,
    };
  }

  const scores = attempts.map((a) => a.score);
  const now = new Date();
  const weekAgo = new Date(now - 7 * 86400000);
  const monthAgo = new Date(now - 30 * 86400000);

  const weeklyAttempts = attempts.filter((a) => new Date(a.createdAt) >= weekAgo).length;
  const monthlyAttempts = attempts.filter((a) => new Date(a.createdAt) >= monthAgo).length;
  const totalStudyTime = Math.round(attempts.reduce((s, a) => s + (a.timeSpent || 0), 0) / 1000 / 60);

  // Streak: consecutive days with at least one attempt
  let streak = 0;
  const daySet = new Set(attempts.map((a) => new Date(a.createdAt).toISOString().split('T')[0]));
  let checkDate = new Date(now);
  while (daySet.has(checkDate.toISOString().split('T')[0])) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Recent trend: compare last 5 vs previous 5
  const recent = attempts.slice(0, 5).map((a) => a.score);
  const previous = attempts.slice(5, 10).map((a) => a.score);
  let recentTrend = 'stable';
  if (recent.length >= 2 && previous.length >= 2) {
    const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
    const prevAvg = previous.reduce((s, v) => s + v, 0) / previous.length;
    if (recentAvg - prevAvg > 5) recentTrend = 'improving';
    else if (recentAvg - prevAvg < -5) recentTrend = 'declining';
  }

  return {
    totalAttempts: attempts.length,
    avgScore: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    bestScore: Math.max(...scores),
    streak,
    recentTrend,
    weeklyAttempts,
    monthlyAttempts,
    totalStudyTime,
  };
};

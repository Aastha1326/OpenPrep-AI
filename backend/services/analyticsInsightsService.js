/**
 * Analytics Insights Service
 * Aggregates user study data across quiz attempts, study plans,
 * focus sessions, flashcard reviews, and activity logs to produce
 * actionable performance insights and trend data.
 */

const {
  QuizAttempt,
  Quiz,
  StudyPlan,
  Subject,
  FocusSession,
  Flashcard,
  Progress,
  ActivityLog,
  User,
  StudySession,
  Topic,
} = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// ─── Constants ──────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SUBJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

/**
 * Computes the start date (N days ago) as a Date object.
 */
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Format a Date as YYYY-MM-DD string.
 */
const toDateStr = (d) => d.toISOString().split('T')[0];

// ─── Weekly Study Overview ──────────────────────────────────────────────────

/**
 * Returns per-day study metrics for the last `days` (default 28).
 * Each day includes: questions solved, flashcards reviewed,
 * focus minutes, and study plan tasks completed.
 */
const getWeeklyStudyOverview = async (userId, days = 28) => {
  const since = daysAgo(days);

  const [quizAttempts, flashcardProgress, focusSessions, activityLogs] =
    await Promise.all([
      QuizAttempt.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: since },
        },
        attributes: [
          [fn('DATE', col('createdAt')), 'date'],
          [fn('SUM', literal('"QuizAttempt"."questionsSolved" || 0')), 'questionsSolved'],
          [fn('COUNT', col('QuizAttempt.id')), 'attemptCount'],
        ],
        group: [fn('DATE', col('createdAt'))],
        raw: true,
      }).catch(() => []),

      Progress.findAll({
        where: {
          userId,
          type: 'flashcard_review',
          createdAt: { [Op.gte]: since },
        },
        attributes: [
          [fn('DATE', col('createdAt')), 'date'],
          [fn('COUNT', col('id')), 'flashcardsReviewed'],
        ],
        group: [fn('DATE', col('createdAt'))],
        raw: true,
      }).catch(() => []),

      FocusSession.findAll({
        where: {
          userId,
          startTime: { [Op.gte]: since },
        },
        attributes: [
          [fn('DATE', col('startTime')), 'date'],
          [fn('SUM', literal(
            'EXTRACT(EPOCH FROM ("FocusSession"."endTime" - "FocusSession"."startTime")) / 60'
          )), 'focusMinutes'],
        ],
        group: [fn('DATE', col('startTime'))],
        raw: true,
      }).catch(() => []),

      ActivityLog.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: since },
        },
        attributes: [
          [fn('DATE', col('createdAt')), 'date'],
          [fn('SUM', literal('"ActivityLog"."xpEarned" || 0')), 'xpEarned'],
        ],
        group: [fn('DATE', col('createdAt'))],
        raw: true,
      }).catch(() => []),
    ]);

  // Build a day-indexed map
  const overview = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = toDateStr(d);
    overview[key] = {
      date: key,
      dayOfWeek: DAYS_OF_WEEK[d.getDay()],
      questionsSolved: 0,
      flashcardsReviewed: 0,
      focusMinutes: 0,
      xpEarned: 0,
      studyScore: 0,
    };
  }

  quizAttempts.forEach((row) => {
    const key = String(row.date).slice(0, 10);
    if (overview[key]) {
      overview[key].questionsSolved += Number(row.questionsSolved) || 0;
    }
  });

  flashcardProgress.forEach((row) => {
    const key = String(row.date).slice(0, 10);
    if (overview[key]) {
      overview[key].flashcardsReviewed += Number(row.flashcardsReviewed) || 0;
    }
  });

  focusSessions.forEach((row) => {
    const key = String(row.date).slice(0, 10);
    if (overview[key]) {
      overview[key].focusMinutes += Math.round(Number(row.focusMinutes) || 0);
    }
  });

  activityLogs.forEach((row) => {
    const key = String(row.date).slice(0, 10);
    if (overview[key]) {
      overview[key].xpEarned += Number(row.xpEarned) || 0;
    }
  });

  // Calculate a composite study score (0-100) per day
  Object.values(overview).forEach((day) => {
    const quizScore = Math.min(day.questionsSolved * 4, 30);
    const flashScore = Math.min(day.flashcardsReviewed * 3, 25);
    const focusScore = Math.min(day.focusMinutes * 0.5, 25);
    const xpScore = Math.min(day.xpEarned * 0.2, 20);
    day.studyScore = Math.round(quizScore + flashScore + focusScore + xpScore);
  });

  return Object.values(overview);
};

// ─── Subject Mastery Grid ───────────────────────────────────────────────────

/**
 * Returns per-subject mastery metrics:
 * quizzes taken, average accuracy, flashcards reviewed, and an
 * overall mastery score (0-100).
 */
const getSubjectMastery = async (userId) => {
  const subjects = await Subject.findAll({ raw: true }).catch(() => []);
  if (subjects.length === 0) return [];

  const results = [];

  for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i];

    const quizStats = await QuizAttempt.findAll({
      where: { userId },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          where: { subjectId: subject.id },
          required: true,
          attributes: [],
        },
      ],
      attributes: [
        [fn('COUNT', col('QuizAttempt.id')), 'totalAttempts'],
        [fn('AVG', col('accuracy')), 'avgAccuracy'],
        [fn('SUM', col('questionsSolved')), 'totalQuestions'],
      ],
      raw: true,
    }).catch(() => [{ totalAttempts: 0, avgAccuracy: 0, totalQuestions: 0 }]);

    const stats = quizStats[0] || {};
    const avgAccuracy = Math.round(Number(stats.avgAccuracy) || 0);
    const totalAttempts = Number(stats.totalAttempts) || 0;
    const totalQuestions = Number(stats.totalQuestions) || 0;

    const flashcardCount = await Flashcard.count({
      where: { subjectId: subject.id },
      include: [{ model: Progress, as: 'progresses', where: { userId }, required: false }],
    }).catch(() => 0);

    // Mastery score: 40% accuracy, 30% attempts, 30% flashcard coverage
    const attemptScore = Math.min(totalAttempts * 5, 30);
    const flashScore = Math.min(flashcardCount * 2, 30);
    const accuracyScore = avgAccuracy * 0.4;
    const mastery = Math.round(accuracyScore + attemptScore + flashScore);

    results.push({
      id: subject.id,
      name: subject.name || subject.title || `Subject ${i + 1}`,
      color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
      totalAttempts,
      avgAccuracy,
      totalQuestions,
      flashcardCount,
      mastery: Math.min(mastery, 100),
      masteryLabel:
        mastery >= 80
          ? 'Mastered'
          : mastery >= 50
            ? 'Proficient'
            : mastery >= 25
              ? 'Developing'
              : 'Needs Work',
    });
  }

  return results.sort((a, b) => b.mastery - a.mastery);
};

// ─── Quiz Performance Trend ─────────────────────────────────────────────────

/**
 * Returns quiz accuracy over time (grouped by date) for the last `days`
 * days. Used to render a line/area chart showing improvement trajectory.
 */
const getQuizPerformanceTrend = async (userId, days = 60) => {
  const since = daysAgo(days);

  const attempts = await QuizAttempt.findAll({
    where: {
      userId,
      createdAt: { [Op.gte]: since },
    },
    attributes: [
      [fn('DATE', col('createdAt')), 'date'],
      [fn('AVG', col('accuracy')), 'avgAccuracy'],
      [fn('AVG', col('timeTaken')), 'avgTimeTaken'],
      [fn('COUNT', col('QuizAttempt.id')), 'attemptCount'],
      [fn('SUM', col('questionsSolved')), 'totalQuestions'],
    ],
    group: [fn('DATE', col('createdAt'))],
    order: [[fn('DATE', col('createdAt')), 'ASC']],
    raw: true,
  }).catch(() => []);

  // Compute a 7-day rolling average
  const data = attempts.map((row) => ({
    date: String(row.date).slice(0, 10),
    accuracy: Math.round(Number(row.avgAccuracy) || 0),
    avgTimeTaken: Math.round(Number(row.avgTimeTaken) || 0),
    attemptCount: Number(row.attemptCount) || 0,
    totalQuestions: Number(row.totalQuestions) || 0,
  }));

  // Add rolling average
  for (let i = 0; i < data.length; i++) {
    const windowStart = Math.max(0, i - 6);
    const windowSlice = data.slice(windowStart, i + 1);
    const rollingAvg = Math.round(
      windowSlice.reduce((sum, d) => sum + d.accuracy, 0) / windowSlice.length
    );
    data[i].rollingAccuracy = rollingAvg;
  }

  return data;
};

// ─── Activity Time Pattern ──────────────────────────────────────────────────

/**
 * Returns user activity distribution by hour of day.
 * Helps users discover their peak study hours.
 */
const getActivityTimePattern = async (userId, days = 30) => {
  const since = daysAgo(days);

  const logs = await ActivityLog.findAll({
    where: {
      userId,
      createdAt: { [Op.gte]: since },
    },
    attributes: [
      [fn('EXTRACT', literal('HOUR FROM "ActivityLog"."createdAt"')), 'hour'],
      [fn('COUNT', col('id')), 'activityCount'],
      [fn('SUM', col('xpEarned')), 'xpEarned'],
    ],
    group: [fn('EXTRACT', literal('HOUR FROM "ActivityLog"."createdAt"'))],
    order: [[fn('EXTRACT', literal('HOUR FROM "ActivityLog"."createdAt"')), 'ASC']],
    raw: true,
  }).catch(() => []);

  // Build 24-hour grid
  const pattern = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${h.toString().padStart(2, '0')}:00`,
    period: h < 6 ? 'Night' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night',
    activityCount: 0,
    xpEarned: 0,
    intensity: 0,
  }));

  let maxCount = 0;
  logs.forEach((row) => {
    const h = Number(row.hour);
    if (h >= 0 && h < 24) {
      pattern[h].activityCount = Number(row.activityCount) || 0;
      pattern[h].xpEarned = Number(row.xpEarned) || 0;
      maxCount = Math.max(maxCount, pattern[h].activityCount);
    }
  });

  // Normalize intensity to 0-100
  pattern.forEach((slot) => {
    slot.intensity = maxCount > 0 ? Math.round((slot.activityCount / maxCount) * 100) : 0;
  });

  // Find peak hours
  const sorted = [...pattern].sort((a, b) => b.activityCount - a.activityCount);
  const peakHours = sorted.slice(0, 3).filter((s) => s.activityCount > 0);

  return { pattern, peakHours };
};

// ─── Study Recommendations (AI-like heuristic) ─────────────────────────────

/**
 * Generates data-driven study recommendations based on the user's
 * recent performance patterns. Pure backend logic, no external AI call.
 */
const getStudyRecommendations = async (userId) => {
  const overview = await getWeeklyStudyOverview(userId, 14);
  const subjects = await getSubjectMastery(userId);
  const { peakHours } = await getActivityTimePattern(userId, 14);

  const recommendations = [];

  // 1. Consistency check
  const activeDays = overview.filter((d) => d.studyScore > 10).length;
  const consistency = Math.round((activeDays / 14) * 100);

  if (consistency < 40) {
    recommendations.push({
      type: 'consistency',
      priority: 'high',
      icon: 'Target',
      title: 'Study More Consistently',
      description: `You studied on ${activeDays} of the last 14 days. Aim for at least 5 days/week to build a strong habit.`,
      action: 'Set a daily study reminder',
      metric: `${consistency}% consistency`,
    });
  }

  // 2. Subject weakness
  const weakSubjects = subjects.filter((s) => s.mastery < 40);
  if (weakSubjects.length > 0) {
    const weakest = weakSubjects[0];
    recommendations.push({
      type: 'weakness',
      priority: 'high',
      icon: 'AlertTriangle',
      title: `Focus on ${weakest.name}`,
      description: `${weakest.name} has only ${weakest.mastery}% mastery with ${weakest.totalAttempts} quiz attempts. This needs attention before your exam.`,
      action: `Generate a ${weakest.name} practice quiz`,
      metric: `${weakest.mastery}% mastery`,
    });
  }

  // 3. Peak hours insight
  if (peakHours.length > 0) {
    const peak = peakHours[0];
    recommendations.push({
      type: 'timing',
      priority: 'medium',
      icon: 'Clock',
      title: `Your Peak Study Time is ${peak.label}`,
      description: `You're most active during ${peak.period} hours. Schedule challenging topics during this window for maximum retention.`,
      action: 'Schedule key topics now',
      metric: `${peak.activityCount} activities at ${peak.label}`,
    });
  }

  // 4. Flashcard review reminder
  const totalFlashcards = overview.reduce((s, d) => s + d.flashcardsReviewed, 0);
  if (totalFlashcards < 20) {
    recommendations.push({
      type: 'flashcards',
      priority: 'medium',
      icon: 'Layers',
      title: 'Review More Flashcards',
      description: `Only ${totalFlashcards} flashcards reviewed in 2 weeks. Spaced repetition requires regular review for long-term retention.`,
      action: 'Start a flashcard review session',
      metric: `${totalFlashcards} cards / 2 weeks`,
    });
  }

  // 5. Study duration
  const totalMinutes = overview.reduce((s, d) => s + d.focusMinutes, 0);
  const avgDaily = Math.round(totalMinutes / 14);
  if (avgDaily < 30) {
    recommendations.push({
      type: 'duration',
      priority: 'medium',
      icon: 'Timer',
      title: 'Increase Daily Study Time',
      description: `Your average is ${avgDaily} min/day. Research shows 45-90 minute focused blocks with breaks are optimal for learning.`,
      action: 'Use the Pomodoro timer',
      metric: `${avgDaily} min/day average`,
    });
  }

  // 6. Quiz performance
  const avgAccuracy = subjects.length
    ? Math.round(subjects.reduce((s, sub) => s + sub.avgAccuracy, 0) / subjects.length)
    : 0;
  if (avgAccuracy >= 70) {
    recommendations.push({
      type: 'strength',
      priority: 'low',
      icon: 'TrendingUp',
      title: 'Strong Quiz Performance!',
      description: `Your average accuracy is ${avgAccuracy}% across all subjects. Great job! Try tackling more advanced topics.`,
      action: 'Try a harder quiz difficulty',
      metric: `${avgAccuracy}% avg accuracy`,
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    consistency,
    activeDays,
    recommendations,
    summary: {
      totalStudyMinutes: totalMinutes,
      totalQuizQuestions: overview.reduce((s, d) => s + d.questionsSolved, 0),
      totalFlashcards: totalFlashcards,
      totalXpEarned: overview.reduce((s, d) => s + d.xpEarned, 0),
    },
  };
};

// ─── Export ──────────────────────────────────────────────────────────────────

module.exports = {
  getWeeklyStudyOverview,
  getSubjectMastery,
  getQuizPerformanceTrend,
  getActivityTimePattern,
  getStudyRecommendations,
};

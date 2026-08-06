const { Op, fn, col } = require('sequelize');
const Progress = require('../models/Progress');
const QuizAttempt = require('../models/QuizAttempt');
const Flashcard = require('../models/Flashcard');
const User = require('../models/User');

const TOP_N = 10;
const HOURS_WEIGHT = 1;
const QUIZ_WEIGHT = 2;
const FLASHCARD_WEIGHT = 0.5;

// Start of the current ISO week (Monday 00:00:00 local time)
function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Deterministic anonymous handle so masked students stay distinguishable
function anonymousHandle(userId) {
  return `Anonymous Student #${String(userId).slice(-4).toUpperCase()}`;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

// @desc    Get the weekly study leaderboard (top performers this week)
// @route   GET /api/leaderboard
// @access  Private
exports.getWeeklyLeaderboard = async (req, res, next) => {
  try {
    const weekStart = startOfWeek();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Weekly focus hours: Progress rows touched within the current week
    const [hoursRows, quizRows, flashcardRows] = await Promise.all([
      Progress.findAll({
        attributes: ['user', [fn('SUM', col('studyHours')), 'totalHours']],
        where: { updatedAt: { [Op.gte]: weekStart } },
        group: ['user'],
        raw: true,
      }),
      // Weekly quizzes completed
      QuizAttempt.findAll({
        attributes: ['user', [fn('COUNT', col('id')), 'quizCount']],
        where: { createdAt: { [Op.gte]: weekStart } },
        group: ['user'],
        raw: true,
      }),
      // Weekly flashcard reviews (cards touched within the week)
      Flashcard.findAll({
        attributes: ['user', [fn('COUNT', col('id')), 'reviewCount']],
        where: { updatedAt: { [Op.gte]: weekStart } },
        group: ['user'],
        raw: true,
      }),
    ]);

    const stats = new Map();
    const entryFor = (userId) => {
      if (!stats.has(userId)) {
        stats.set(userId, {
          userId,
          weeklyHours: 0,
          quizzesCompleted: 0,
          flashcardsReviewed: 0,
        });
      }
      return stats.get(userId);
    };

    hoursRows.forEach((r) => {
      entryFor(r.user).weeklyHours = parseFloat(r.totalHours) || 0;
    });
    quizRows.forEach((r) => {
      entryFor(r.user).quizzesCompleted = parseInt(r.quizCount, 10) || 0;
    });
    flashcardRows.forEach((r) => {
      entryFor(r.user).flashcardsReviewed = parseInt(r.reviewCount, 10) || 0;
    });

    const users = await User.findAll({
      where: { id: { [Op.in]: Array.from(stats.keys()) }, role: 'student' },
      attributes: ['id', 'name', 'leaderboardVisible'],
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const ranked = Array.from(stats.values())
      .filter((e) => userMap.has(e.userId))
      .map((e) => ({
        ...e,
        score: +(e.weeklyHours * HOURS_WEIGHT
          + e.quizzesCompleted * QUIZ_WEIGHT
          + e.flashcardsReviewed * FLASHCARD_WEIGHT).toFixed(2),
      }))
      .sort((a, b) => b.score - a.score);

    const serialize = (entry, index) => {
      const user = userMap.get(entry.userId);
      const isAnonymous = user.leaderboardVisible === false;
      return {
        rank: index + 1,
        userId: entry.userId,
        name: isAnonymous ? anonymousHandle(entry.userId) : (user.name || 'Unknown Student'),
        isAnonymous,
        weeklyHours: round1(entry.weeklyHours),
        quizzesCompleted: entry.quizzesCompleted,
        flashcardsReviewed: entry.flashcardsReviewed,
        score: entry.score,
      };
    };

    const entries = ranked.slice(0, TOP_N).map(serialize);

    const myIndex = ranked.findIndex((e) => e.userId === req.user.id);
    const currentUser = myIndex >= 0 ? serialize(ranked[myIndex], myIndex) : null;

    res.status(200).json({
      success: true,
      data: {
        weekStart,
        weekEnd,
        entries,
        currentUser,
        totalParticipants: ranked.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

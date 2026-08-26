const learningInsightsService = require('../services/learningInsightsService');
const cacheService = require('../services/cacheService');
const ActivityLog = require('../models/ActivityLog');

const CACHE_TTL = 300; // 5 minutes

/**
 * @desc    Get full learning analytics dashboard data
 * @route   GET /api/learning-insights/dashboard
 * @access  Private
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const { windowDays, examId } = req.query;
    const parsedWindow = windowDays ? parseInt(windowDays, 10) : 30;

    if (isNaN(parsedWindow) || parsedWindow < 1 || parsedWindow > 365) {
      return res.status(400).json({
        success: false,
        error: 'windowDays must be between 1 and 365',
      });
    }

    const cacheKey = `learning_insights:dashboard:${req.user.id}:${parsedWindow}:${examId || 'all'}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      try {
        return res.status(200).json({ success: true, data: JSON.parse(cached), cached: true });
      } catch (_) {
        // cache corrupted, recompute
      }
    }

    const data = await learningInsightsService.getFullAnalytics(req.user.id, {
      windowDays: parsedWindow,
      examId,
    });

    await cacheService.set(cacheKey, JSON.stringify(data), CACHE_TTL);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get quiz performance summary
 * @route   GET /api/learning-insights/quiz-performance
 * @access  Private
 */
exports.getQuizPerformance = async (req, res, next) => {
  try {
    const { windowDays, examId } = req.query;
    const parsedWindow = windowDays ? parseInt(windowDays, 10) : 30;

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - parsedWindow);

    const data = await learningInsightsService.getQuizPerformanceSummary(
      req.user.id,
      windowStart,
      examId
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get subject mastery scores
 * @route   GET /api/learning-insights/subject-mastery
 * @access  Private
 */
exports.getSubjectMastery = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const data = await learningInsightsService.getSubjectMasteryScores(
      req.user.id,
      examId
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get study velocity metrics
 * @route   GET /api/learning-insights/study-velocity
 * @access  Private
 */
exports.getStudyVelocity = async (req, res, next) => {
  try {
    const { windowDays } = req.query;
    const parsedWindow = windowDays ? parseInt(windowDays, 10) : 30;

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - parsedWindow);

    const data = await learningInsightsService.getStudyVelocity(
      req.user.id,
      windowStart
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get study time distribution
 * @route   GET /api/learning-insights/time-distribution
 * @access  Private
 */
exports.getTimeDistribution = async (req, res, next) => {
  try {
    const { windowDays } = req.query;
    const parsedWindow = windowDays ? parseInt(windowDays, 10) : 30;

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - parsedWindow);

    const data = await learningInsightsService.getStudyTimeDistribution(
      req.user.id,
      windowStart
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get streak data
 * @route   GET /api/learning-insights/streaks
 * @access  Private
 */
exports.getStreaks = async (req, res, next) => {
  try {
    const data = await learningInsightsService.getStreakData(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get readiness forecast for active exam
 * @route   GET /api/learning-insights/readiness-forecast
 * @access  Private
 */
exports.getReadinessForecast = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const data = await learningInsightsService.getReadinessForecast(
      req.user.id,
      examId
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get week-over-week comparative report
 * @route   GET /api/learning-insights/weekly-comparison
 * @access  Private
 */
exports.getWeeklyComparison = async (req, res, next) => {
  try {
    const data = await learningInsightsService.getComparativeReport(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get personal best records
 * @route   GET /api/learning-insights/personal-best
 * @access  Private
 */
exports.getPersonalBest = async (req, res, next) => {
  try {
    const { Exam, QuizAttempt, Quiz } = require('../models');
    const { Op } = require('sequelize');

    // Best single quiz score
    const bestScore = await QuizAttempt.findOne({
      where: { user: req.user.id },
      order: [['score', 'DESC']],
      include: [{ model: Quiz, as: 'quizRef', attributes: ['id', 'title', 'subject'] }],
    });

    // Best subject average
    const subjectMastery = await learningInsightsService.getSubjectMasteryScores(
      req.user.id
    );
    const bestSubject = subjectMastery.length > 0 ? subjectMastery[0] : null;

    // Longest study session
    const FocusSession = require('../models/FocusSession');
    const longestSession = await FocusSession.findOne({
      where: { user: req.user.id },
      order: [['duration', 'DESC']],
      attributes: ['id', 'duration', 'type', 'createdAt'],
    });

    // Most quizzes in one day
    const allAttempts = await QuizAttempt.findAll({
      where: { user: req.user.id },
      attributes: ['id', 'createdAt'],
    });
    const dayCounts = {};
    for (const a of allAttempts) {
      const d = a.createdAt.toISOString().split('T')[0];
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    }
    const mostQuizzesDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0];

    res.status(200).json({
      success: true,
      data: {
        bestQuizScore: bestScore
          ? {
              score: bestScore.score,
              quizId: bestScore.quiz?.id,
              quizTitle: bestScore.quiz?.title,
              achievedAt: bestScore.createdAt,
            }
          : null,
        bestSubject: bestSubject
          ? {
              name: bestSubject.subjectName,
              masteryScore: bestSubject.masteryScore,
              averageScore: bestSubject.averageScore,
              attempts: bestSubject.quizAttempts,
            }
          : null,
        longestFocusSession: longestSession
          ? {
              durationMinutes: longestSession.duration,
              type: longestSession.type,
              date: longestSession.createdAt,
            }
          : null,
        mostQuizzesInOneDay: mostQuizzesDay
          ? { date: mostQuizzesDay[0], count: mostQuizzesDay[1] }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get insights summary for email digest / notifications
 * @route   GET /api/learning-insights/summary
 * @access  Private
 */
exports.getInsightsSummary = async (req, res, next) => {
  try {
    const analytics = await learningInsightsService.getFullAnalytics(req.user.id, {
      windowDays: 7,
    });

    const highlights = [];

    // Quiz performance highlight
    if (analytics.quizPerformance.totalAttempts > 0) {
      const trend = analytics.quizPerformance.trend;
      highlights.push({
        type: 'quiz_performance',
        icon: trend.direction === 'improving' ? '📈' : trend.direction === 'declining' ? '📉' : '➡️',
        title: 'Quiz Performance',
        value: `${analytics.quizPerformance.averageScore}% average`,
        detail: trend.label,
      });
    }

    // Streak highlight
    if (analytics.streakData.currentStreak > 0) {
      highlights.push({
        type: 'streak',
        icon: '🔥',
        title: 'Study Streak',
        value: `${analytics.streakData.currentStreak} day${analytics.streakData.currentStreak !== 1 ? 's' : ''}`,
        detail: `Longest: ${analytics.streakData.longestStreak} days`,
      });
    }

    // Study velocity highlight
    if (analytics.studyVelocity.totalTasksCompleted > 0) {
      highlights.push({
        type: 'velocity',
        icon: '⚡',
        title: 'Study Velocity',
        value: `${analytics.studyVelocity.tasksPerDay} tasks/day`,
        detail: `${analytics.studyVelocity.completionRate}% completion rate`,
      });
    }

    // Readiness highlight
    if (analytics.readinessForecast.hasActivePlan) {
      highlights.push({
        type: 'readiness',
        icon: '🎯',
        title: 'Exam Readiness',
        value: analytics.readinessForecast.projectedExamScore
          ? `Projected: ${analytics.readinessForecast.projectedExamScore}%`
          : 'Building baseline',
        detail: analytics.readinessForecast.daysUntilExam
          ? `${analytics.readinessForecast.daysUntilExam} days until exam`
          : 'No exam date set',
      });
    }

    // Weakest subject
    const weakest = analytics.subjectMastery.find(
      (s) => s.quizAttempts > 0 && s.masteryScore < 50
    );
    if (weakest) {
      highlights.push({
        type: 'weakness',
        icon: '⚠️',
        title: 'Needs Attention',
        value: weakest.subjectName,
        detail: `${weakest.averageScore}% average — review recommended`,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        windowDays: 7,
        generatedAt: analytics.generatedAt,
        highlights,
        statsOverview: {
          totalQuizzes: analytics.quizPerformance.totalAttempts,
          averageScore: analytics.quizPerformance.averageScore,
          studyDays: analytics.studyVelocity.activeStudyDays,
          totalStudyHours: analytics.timeDistribution.totalTimeHours,
          currentStreak: analytics.streakData.currentStreak,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

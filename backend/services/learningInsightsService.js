const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const QuizAttempt = require('../models/QuizAttempt');
const StudyPlan = require('../models/StudyPlan');
const Quiz = require('../models/Quiz');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const ActivityLog = require('../models/ActivityLog');
const FocusSession = require('../models/FocusSession');
const Flashcard = require('../models/Flashcard');
const User = require('../models/User');

/**
 * LearningInsightsService
 *
 * Aggregates quiz performance, study-time distribution, streak data,
 * subject-level mastery and completion velocity into actionable analytics
 * for the Learning Insights Dashboard.
 */
class LearningInsightsService {
  /**
   * Compute a full analytics payload for the given user.
   *
   * @param {string} userId
   * @param {Object} [options]
   * @param {number} [options.windowDays=30]  Rolling window in days
   * @param {string} [options.examId]         Optional exam scope filter
   * @returns {Promise<Object>}              Composite analytics object
   */
  async getFullAnalytics(userId, { windowDays = 30, examId } = {}) {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowDays);

    const [
      quizSummary,
      subjectMastery,
      studyVelocity,
      timeDistribution,
      streakData,
      readinessForecast,
    ] = await Promise.all([
      this.getQuizPerformanceSummary(userId, windowStart, examId),
      this.getSubjectMasteryScores(userId, examId),
      this.getStudyVelocity(userId, windowStart),
      this.getStudyTimeDistribution(userId, windowStart),
      this.getStreakData(userId),
      this.getReadinessForecast(userId, examId),
    ]);

    return {
      windowDays,
      generatedAt: new Date().toISOString(),
      quizPerformance: quizSummary,
      subjectMastery,
      studyVelocity,
      timeDistribution,
      streakData,
      readinessForecast,
    };
  }

  /**
   * Compute quiz performance metrics over the rolling window.
   *
   * @param {string} userId
   * @param {Date}   windowStart
   * @param {string} [examId]
   * @returns {Promise<Object>}
   */
  async getQuizPerformanceSummary(userId, windowStart, examId) {
    const where = { user: userId, createdAt: { [Op.gte]: windowStart } };

    const attempts = await QuizAttempt.findAll({
      where,
      include: [
        {
          model: Quiz,
          as: 'quizRef',
          attributes: ['id', 'subject', 'topic', 'totalQuestions'],
          ...(examId ? { where: {} } : {}),
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    if (attempts.length === 0) {
      return this._emptyQuizPerformance();
    }

    const scores = attempts.map((a) => a.score || 0);
    const totalAttempted = scores.length;
    const averageScore = scores.reduce((s, v) => s + v, 0) / totalAttempted;
    const medianScore = this._median(scores);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const standardDeviation = this._standardDeviation(scores);

    // Trend: split window in half and compare averages
    const midpoint = Math.floor(totalAttempted / 2);
    const firstHalf = scores.slice(0, midpoint);
    const secondHalf = scores.slice(midpoint);
    const firstHalfAvg = firstHalf.length
      ? firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length
      : 0;
    const secondHalfAvg = secondHalf.length
      ? secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length
      : 0;
    const trendDirection =
      secondHalfAvg - firstHalfAvg > 2
        ? 'improving'
        : secondHalfAvg - firstHalfAvg < -2
          ? 'declining'
          : 'stable';
    const trendDelta = Number((secondHalfAvg - firstHalfAvg).toFixed(2));

    // Time spent per attempt
    const timeSpentValues = attempts
      .map((a) => a.timeSpent || 0)
      .filter((t) => t > 0);
    const avgTimePerAttempt = timeSpentValues.length
      ? timeSpentValues.reduce((s, v) => s + v, 0) / timeSpentValues.length
      : 0;

    // Per-question accuracy (score is percentage, totalQuestions is from quiz)
    const totalQuestionsAnswered = attempts.reduce(
      (sum, a) => sum + (a.totalQuestions || 0),
      0
    );
    const totalCorrectAnswers = attempts.reduce(
      (sum, a) => sum + Math.round(((a.score || 0) / 100) * (a.totalQuestions || 0)),
      0
    );
    const overallAccuracy = totalQuestionsAnswered > 0
      ? Number(((totalCorrectAnswers / totalQuestionsAnswered) * 100).toFixed(2))
      : 0;

    // Daily score breakdown for sparkline data
    const dailyScores = this._aggregateDailyScores(attempts);

    return {
      totalAttempts: totalAttempted,
      averageScore: Number(averageScore.toFixed(2)),
      medianScore: Number(medianScore.toFixed(2)),
      minScore: Number(minScore.toFixed(2)),
      maxScore: Number(maxScore.toFixed(2)),
      standardDeviation: Number(standardDeviation.toFixed(2)),
      overallAccuracy,
      totalQuestionsAnswered,
      totalCorrectAnswers,
      avgTimePerAttemptSeconds: Number(avgTimePerAttempt.toFixed(1)),
      trend: {
        direction: trendDirection,
        delta: trendDelta,
        label:
          trendDirection === 'improving'
            ? `Scores improved by ${Math.abs(trendDelta)}% in the second half`
            : trendDirection === 'declining'
              ? `Scores dropped by ${Math.abs(trendDelta)}% in the second half`
              : 'Scores remained consistent',
      },
      dailyScores,
    };
  }

  /**
   * Compute subject-level mastery scores using weighted quiz performance
   * and flashcard review data.
   *
   * @param {string} userId
   * @param {string} [examId]
   * @returns {Promise<Object[]>}
   */
  async getSubjectMasteryScores(userId, examId) {
    const subjects = await Subject.findAll({
      where: { user: userId, ...(examId ? { exam: examId } : {}) },
      attributes: ['id', 'name', 'exam'],
    });

    const masteryScores = [];

    for (const subject of subjects) {
      // Get all quiz attempts for quizzes linked to this subject
      const attempts = await QuizAttempt.findAll({
        where: { user: userId },
        include: [
          {
            model: Quiz,
            as: 'quizRef',
            where: { subject: subject.id },
            attributes: ['id', 'totalQuestions'],
          },
        ],
        attributes: ['score', 'totalQuestions', 'createdAt'],
        order: [['createdAt', 'ASC']],
      });

      // Get topic count for subject coverage
      const topicCount = await Topic.count({
        where: { subject: subject.id, user: userId },
      });

      // Get flashcard count for active recall data
      const flashcardCount = await Flashcard.count({
        where: { subject: subject.id, user: userId },
      });

      if (attempts.length === 0) {
        masteryScores.push({
          subjectId: subject.id,
          subjectName: subject.name,
          examId: subject.exam,
          masteryScore: 0,
          quizAttempts: 0,
          averageScore: 0,
          topicCount,
          flashcardCount,
          coverageLevel: 'not_started',
          trend: 'unknown',
        });
        continue;
      }

      const scores = attempts.map((a) => a.score || 0);
      const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;

      // Weighted mastery: recent attempts count more (exponential decay)
      const recencyWeighted = this._recencyWeightedAverage(
        attempts.map((a) => ({
          score: a.score || 0,
          date: a.createdAt,
        }))
      );

      // Trend based on last 5 attempts vs previous 5
      const recentAttempts = attempts.slice(-5);
      const priorAttempts = attempts.slice(-10, -5);
      const recentAvg = recentAttempts.length
        ? recentAttempts.reduce((s, a) => s + (a.score || 0), 0) / recentAttempts.length
        : 0;
      const priorAvg = priorAttempts.length
        ? priorAttempts.reduce((s, a) => s + (a.score || 0), 0) / priorAttempts.length
        : 0;
      const trend =
        recentAvg - priorAvg > 3
          ? 'improving'
          : recentAvg - priorAvg < -3
            ? 'declining'
            : 'stable';

      const coverageLevel =
        avgScore >= 80
          ? 'mastered'
          : avgScore >= 60
            ? 'proficient'
            : avgScore >= 40
              ? 'developing'
              : 'needs_attention';

      masteryScores.push({
        subjectId: subject.id,
        subjectName: subject.name,
        examId: subject.exam,
        masteryScore: Number(recencyWeighted.toFixed(2)),
        quizAttempts: attempts.length,
        averageScore: Number(avgScore.toFixed(2)),
        topicCount,
        flashcardCount,
        coverageLevel,
        trend,
        recentAvg: Number(recentAvg.toFixed(2)),
        priorAvg: Number(priorAvg.toFixed(2)),
      });
    }

    // Sort by mastery score descending
    masteryScores.sort((a, b) => b.masteryScore - a.masteryScore);

    return masteryScores;
  }

  /**
   * Calculate study velocity: tasks completed per day over the window.
   *
   * @param {string} userId
   * @param {Date}   windowStart
   * @returns {Promise<Object>}
   */
  async getStudyVelocity(userId, windowStart) {
    const plans = await StudyPlan.findAll({
      where: { user: userId },
      attributes: ['id', 'dailyGoals', 'startDate', 'endDate', 'status'],
    });

    const startDateStr = windowStart.toISOString().split('T')[0];
    let totalTasksCompleted = 0;
    let totalTasksPlanned = 0;
    const dailyCompletion = {};

    for (const plan of plans) {
      const goals = plan.dailyGoals || [];
      for (const goal of goals) {
        const goalDate = typeof goal.date === 'string' ? goal.date : goal.date?.toISOString?.()?.split('T')[0];
        if (!goalDate || goalDate < startDateStr) continue;

        const tasks = goal.tasks || [];
        for (const task of tasks) {
          totalTasksPlanned++;
          if (task.completed) totalTasksCompleted++;

          if (!dailyCompletion[goalDate]) {
            dailyCompletion[goalDate] = { planned: 0, completed: 0 };
          }
          dailyCompletion[goalDate].planned++;
          if (task.completed) dailyCompletion[goalDate].completed++;
        }
      }
    }

    // Calculate active study days (days with at least one task completed)
    const activeStudyDays = Object.values(dailyCompletion).filter(
      (d) => d.completed > 0
    ).length;

    const totalDaysInWindow = Math.max(
      1,
      Math.ceil(
        (Date.now() - windowStart.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    const tasksPerDay =
      activeStudyDays > 0
        ? Number((totalTasksCompleted / activeStudyDays).toFixed(2))
        : 0;

    const completionRate =
      totalTasksPlanned > 0
        ? Number(((totalTasksCompleted / totalTasksPlanned) * 100).toFixed(2))
        : 0;

    // Consistency score: % of days in window where at least one task was done
    const consistencyScore = Number(
      ((activeStudyDays / totalDaysInWindow) * 100).toFixed(2)
    );

    // Build sparkline: daily completed counts
    const sparkline = Object.entries(dailyCompletion)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        completed: data.completed,
        planned: data.planned,
      }));

    return {
      totalTasksPlanned,
      totalTasksCompleted,
      activeStudyDays,
      totalDaysInWindow,
      tasksPerDay,
      completionRate,
      consistencyScore,
      sparkline,
    };
  }

  /**
   * Calculate study time distribution from focus sessions and quiz attempts.
   *
   * @param {string} userId
   * @param {Date}   windowStart
   * @returns {Promise<Object>}
   */
  async getStudyTimeDistribution(userId, windowStart) {
    // Focus sessions
    const focusSessions = await FocusSession.findAll({
      where: {
        user: userId,
        createdAt: { [Op.gte]: windowStart },
      },
      attributes: ['id', 'duration', 'createdAt', 'type'],
    });

    // Quiz time from attempts
    const quizAttempts = await QuizAttempt.findAll({
      where: {
        user: userId,
        createdAt: { [Op.gte]: windowStart },
      },
      attributes: ['id', 'timeSpent', 'createdAt'],
    });

    // Aggregate time by category
    const categoryTime = {
      focusSession: 0,
      quiz: 0,
      total: 0,
    };

    for (const session of focusSessions) {
      const dur = session.duration || 0;
      categoryTime.focusSession += dur;
      categoryTime.total += dur;
    }

    for (const attempt of quizAttempts) {
      const dur = attempt.timeSpent || 0;
      categoryTime.quiz += dur;
      categoryTime.total += dur;
    }

    // Convert to hours
    const toHours = (seconds) => Number((seconds / 3600).toFixed(2));

    // Daily breakdown
    const dailyBreakdown = {};
    for (const session of focusSessions) {
      const dateStr = session.createdAt.toISOString().split('T')[0];
      if (!dailyBreakdown[dateStr]) dailyBreakdown[dateStr] = { focusSession: 0, quiz: 0 };
      dailyBreakdown[dateStr].focusSession += session.duration || 0;
    }
    for (const attempt of quizAttempts) {
      const dateStr = attempt.createdAt.toISOString().split('T')[0];
      if (!dailyBreakdown[dateStr]) dailyBreakdown[dateStr] = { focusSession: 0, quiz: 0 };
      dailyBreakdown[dateStr].quiz += attempt.timeSpent || 0;
    }

    const dailyDistribution = Object.entries(dailyBreakdown)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        focusSessionHours: toHours(data.focusSession),
        quizHours: toHours(data.quiz),
        totalHours: toHours(data.focusSession + data.quiz),
      }));

    const sessionCount = focusSessions.length + quizAttempts.length;
    const avgSessionMinutes =
      sessionCount > 0
        ? Number(((categoryTime.total / sessionCount) / 60).toFixed(1))
        : 0;

    return {
      focusSessionTimeHours: toHours(categoryTime.focusSession),
      quizTimeHours: toHours(categoryTime.quiz),
      totalTimeHours: toHours(categoryTime.total),
      focusSessionCount: focusSessions.length,
      quizCount: quizAttempts.length,
      avgSessionMinutes,
      dailyDistribution,
    };
  }

  /**
   * Calculate streak data: current streak, longest streak, and history.
   *
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getStreakData(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'streak', 'longestStreak', 'lastActiveDate'],
    });

    if (!user) {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, streakHistory: [] };
    }

    // Get recent activity logs to compute streak history
    const recentLogs = await ActivityLog.findAll({
      where: {
        user: userId,
        createdAt: { [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      attributes: ['id', 'activityType', 'createdAt'],
      order: [['createdAt', 'ASC']],
    });

    // Build set of active dates
    const activeDates = new Set();
    for (const log of recentLogs) {
      const dateStr = log.createdAt.toISOString().split('T')[0];
      activeDates.add(dateStr);
    }

    // Compute current streak from today backwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentStreak = 0;
    let checkDate = new Date(today);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (activeDates.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Compute longest streak from the 90-day window
    const sortedDates = Array.from(activeDates).sort();
    let longestInWindow = 0;
    let streakRun = 0;
    let prevDate = null;

    for (const dateStr of sortedDates) {
      if (prevDate) {
        const prev = new Date(prevDate);
        const curr = new Date(dateStr);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streakRun++;
        } else {
          longestInWindow = Math.max(longestInWindow, streakRun);
          streakRun = 1;
        }
      } else {
        streakRun = 1;
      }
      prevDate = dateStr;
    }
    longestInWindow = Math.max(longestInWindow, streakRun);

    // Monthly streak breakdown
    const monthlyBreakdown = {};
    for (const dateStr of sortedDates) {
      const month = dateStr.substring(0, 7); // YYYY-MM
      if (!monthlyBreakdown[month]) monthlyBreakdown[month] = 0;
      monthlyBreakdown[month]++;
    }

    return {
      currentStreak: user.streak || currentStreak,
      longestStreak: Math.max(user.longestStreak || 0, longestInWindow),
      lastActiveDate: user.lastActiveDate,
      activeDaysInWindow: sortedDates.length,
      monthlyBreakdown,
    };
  }

  /**
   * Generate readiness forecast: predicted performance based on current trajectory.
   *
   * @param {string} userId
   * @param {string} [examId]
   * @returns {Promise<Object>}
   */
  async getReadinessForecast(userId, examId) {
    // Get active study plan
    const where = { user: userId, status: 'active' };
    if (examId) where.exam = examId;
    const activePlan = await StudyPlan.findOne({ where });

    if (!activePlan) {
      return {
        hasActivePlan: false,
        projectedCompletion: null,
        estimatedExamScore: null,
        recommendation: 'Create a study plan to get readiness predictions.',
      };
    }

    const goals = activePlan.dailyGoals || [];
    const totalTasks = goals.reduce((sum, g) => sum + (g.tasks?.length || 0), 0);
    const completedTasks = goals.reduce(
      (sum, g) => sum + (g.tasks?.filter((t) => t.completed)?.length || 0),
      0
    );
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Recent quiz performance
    const recentAttempts = await QuizAttempt.findAll({
      where: {
        user: userId,
        createdAt: { [Op.gte]: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      attributes: ['score'],
    });

    const recentAvgScore =
      recentAttempts.length > 0
        ? recentAttempts.reduce((s, a) => s + (a.score || 0), 0) / recentAttempts.length
        : null;

    // Estimate days until exam
    const exam = activePlan.examRef || null;
    let daysUntilExam = null;
    if (exam && exam.date) {
      const examDate = new Date(exam.date);
      daysUntilExam = Math.ceil(
        (examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
    }

    // Simple linear projection
    let projectedScore = recentAvgScore;
    if (recentAvgScore !== null && completionRate > 0) {
      // Weight: 70% current avg, 30% completion-driven boost
      const completionBoost = Math.min(20, (100 - recentAvgScore) * (completionRate / 100) * 0.3);
      projectedScore = Math.min(100, recentAvgScore + completionBoost);
    }

    // Generate recommendation
    let recommendation = '';
    if (completionRate < 30) {
      recommendation = 'Your task completion is low. Focus on consistency to build momentum.';
    } else if (completionRate < 60) {
      recommendation = 'Good progress! Maintain your pace and prioritize weak subjects.';
    } else if (completionRate < 85) {
      recommendation = 'Excellent pace! You are on track. Focus on revision and practice tests.';
    } else {
      recommendation = 'Outstanding completion rate! Focus on timed practice and weak-area review.';
    }

    if (recentAvgScore !== null && recentAvgScore < 50) {
      recommendation += ' Your quiz scores suggest you need more review time on core concepts.';
    }

    return {
      hasActivePlan: true,
      planId: activePlan.id,
      examName: exam?.name || 'Unknown Exam',
      daysUntilExam,
      planCompletionRate: Number(completionRate.toFixed(2)),
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      recentQuizAverage: recentAvgScore !== null ? Number(recentAvgScore.toFixed(2)) : null,
      recentQuizCount: recentAttempts.length,
      projectedExamScore: projectedScore !== null ? Number(projectedScore.toFixed(2)) : null,
      recommendation,
    };
  }

  /**
   * Generate a comparative report: how user compares to their own historical average.
   *
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getComparativeReport(userId) {
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeekAttempts = await QuizAttempt.findAll({
      where: {
        user: userId,
        createdAt: { [Op.gte]: thisWeekStart },
      },
      attributes: ['score', 'timeSpent', 'createdAt'],
    });

    const lastWeekAttempts = await QuizAttempt.findAll({
      where: {
        user: userId,
        createdAt: { [Op.gte]: lastWeekStart, [Op.lt]: thisWeekStart },
      },
      attributes: ['score', 'timeSpent', 'createdAt'],
    });

    const thisWeekAvg =
      thisWeekAttempts.length > 0
        ? thisWeekAttempts.reduce((s, a) => s + (a.score || 0), 0) / thisWeekAttempts.length
        : null;
    const lastWeekAvg =
      lastWeekAttempts.length > 0
        ? lastWeekAttempts.reduce((s, a) => s + (a.score || 0), 0) / lastWeekAttempts.length
        : null;

    const thisWeekTime = thisWeekAttempts.reduce((s, a) => s + (a.timeSpent || 0), 0);
    const lastWeekTime = lastWeekAttempts.reduce((s, a) => s + (a.timeSpent || 0), 0);

    const scoreDelta = thisWeekAvg !== null && lastWeekAvg !== null
      ? Number((thisWeekAvg - lastWeekAvg).toFixed(2))
      : null;
    const timeDelta = thisWeekTime - lastWeekTime;

    return {
      thisWeek: {
        quizCount: thisWeekAttempts.length,
        averageScore: thisWeekAvg !== null ? Number(thisWeekAvg.toFixed(2)) : null,
        totalTimeSeconds: thisWeekTime,
        totalTimeHours: Number((thisWeekTime / 3600).toFixed(2)),
      },
      lastWeek: {
        quizCount: lastWeekAttempts.length,
        averageScore: lastWeekAvg !== null ? Number(lastWeekAvg.toFixed(2)) : null,
        totalTimeSeconds: lastWeekTime,
        totalTimeHours: Number((lastWeekTime / 3600).toFixed(2)),
      },
      comparison: {
        scoreDelta,
        scoreTrend:
          scoreDelta !== null
            ? scoreDelta > 2
              ? 'improving'
              : scoreDelta < -2
                ? 'declining'
                : 'stable'
            : 'insufficient_data',
        timeDeltaSeconds: timeDelta,
        timeDeltaHours: Number((timeDelta / 3600).toFixed(2)),
        timeTrend:
          timeDelta > 300
            ? 'more_time'
            : timeDelta < -300
              ? 'less_time'
              : 'similar',
        summary: this._generateWeeklySummary(scoreDelta, timeDelta, thisWeekAttempts.length),
      },
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  _emptyQuizPerformance() {
    return {
      totalAttempts: 0,
      averageScore: 0,
      medianScore: 0,
      minScore: 0,
      maxScore: 0,
      standardDeviation: 0,
      overallAccuracy: 0,
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
      avgTimePerAttemptSeconds: 0,
      trend: { direction: 'unknown', delta: 0, label: 'No quiz data available.' },
      dailyScores: [],
    };
  }

  _median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  _standardDeviation(arr) {
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const squareDiffs = arr.map((v) => (v - mean) ** 2);
    const avgSquareDiff = squareDiffs.reduce((s, v) => s + v, 0) / arr.length;
    return Math.sqrt(avgSquareDiff);
  }

  _recencyWeightedAverage(entries) {
    if (entries.length === 0) return 0;
    // Sort by date ascending
    const sorted = [...entries].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    let weightedSum = 0;
    let weightTotal = 0;

    sorted.forEach((entry, idx) => {
      // Exponential weight: most recent gets highest weight
      const weight = Math.pow(1.5, idx);
      weightedSum += entry.score * weight;
      weightTotal += weight;
    });

    return weightedSum / weightTotal;
  }

  _aggregateDailyScores(attempts) {
    const dailyMap = {};
    for (const attempt of attempts) {
      const dateStr = attempt.createdAt.toISOString().split('T')[0];
      if (!dailyMap[dateStr]) dailyMap[dateStr] = [];
      dailyMap[dateStr].push(attempt.score || 0);
    }

    return Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => ({
        date,
        average: Number(
          (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2)
        ),
        count: scores.length,
      }));
  }

  _generateWeeklySummary(scoreDelta, timeDelta, quizCount) {
    if (quizCount === 0) return 'No quizzes taken this week. Start practicing to build momentum!';

    let parts = [];

    if (scoreDelta !== null) {
      if (scoreDelta > 5) parts.push('Your scores improved significantly');
      else if (scoreDelta > 2) parts.push('Your scores improved slightly');
      else if (scoreDelta < -5) parts.push('Your scores dropped noticeably');
      else if (scoreDelta < -2) parts.push('Your scores dipped slightly');
      else parts.push('Your scores stayed consistent');
    }

    if (timeDelta > 600) parts.push('you studied more this week');
    else if (timeDelta < -600) parts.push('you studied less this week');
    else parts.push('your study time was similar');

    parts.push(`You took ${quizCount} quiz${quizCount !== 1 ? 'zes' : ''}`);

    return parts.join('. ') + '.';
  }
}

module.exports = new LearningInsightsService();

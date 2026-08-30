const { UserProgress, QuizAttempt, Quiz, ActivityLog } = require('../models');
const logger = require('../utils/logger');

// Fallback catalog of curated quizzes when database has few or no registered quizzes
const CANDIDATE_QUIZ_CATALOG = [
  {
    id: 'quiz-ds-01',
    title: 'Data Structures & Trees Basics',
    topic: 'Data Structures',
    subject: 'Computer Science',
    difficulty: 'easy',
    totalQuestions: 10,
    estimatedMinutes: 8,
    description: 'Master binary trees, stacks, queues, and time complexity fundamentals.',
  },
  {
    id: 'quiz-ds-02',
    title: 'Advanced Graph Algorithms & Dynamic Programming',
    topic: 'Data Structures',
    subject: 'Computer Science',
    difficulty: 'hard',
    totalQuestions: 15,
    estimatedMinutes: 20,
    description: 'Deep dive into Dijkstra, Bellman-Ford, and DP optimization patterns.',
  },
  {
    id: 'quiz-algo-01',
    title: 'Sorting & Searching Algorithms',
    topic: 'Algorithms',
    subject: 'Computer Science',
    difficulty: 'medium',
    totalQuestions: 10,
    estimatedMinutes: 10,
    description: 'Test your understanding of QuickSort, MergeSort, and Binary Search boundary cases.',
  },
  {
    id: 'quiz-sys-01',
    title: 'System Design & Distributed Storage',
    topic: 'System Design',
    subject: 'Computer Science',
    difficulty: 'hard',
    totalQuestions: 12,
    estimatedMinutes: 25,
    description: 'Scalability, caching strategies, database sharding, and CAP theorem trade-offs.',
  },
  {
    id: 'quiz-db-01',
    title: 'SQL & Database Indexing Essentials',
    topic: 'Databases',
    subject: 'Database Systems',
    difficulty: 'medium',
    totalQuestions: 8,
    estimatedMinutes: 10,
    description: 'Relational algebra, B-Trees, transaction isolation levels, and SQL query tuning.',
  },
  {
    id: 'quiz-web-01',
    title: 'REST API Design & Web Security',
    topic: 'Web Development',
    subject: 'Software Engineering',
    difficulty: 'easy',
    totalQuestions: 10,
    estimatedMinutes: 12,
    description: 'HTTP response codes, OAuth2 flows, CSRF prevention, and rate-limiting best practices.',
  },
  {
    id: 'quiz-os-01',
    title: 'Operating System Processes & Memory Management',
    topic: 'Operating Systems',
    subject: 'Computer Science',
    difficulty: 'medium',
    totalQuestions: 10,
    estimatedMinutes: 15,
    description: 'Thread concurrency, virtual memory paging, deadlocks, and CPU scheduling.',
  },
];

class QuizRecommendationService {
  /**
   * Computes a user's performance vector and topic mastery profile.
   * @param {string} userId - Target user ID.
   * @returns {Promise<{ overallAccuracy: number, totalAttempts: number, topicScores: Object, weakTopics: Array, strongTopics: Array }>}
   */
  async getUserPerformanceProfile(userId) {
    let progressRecords = [];
    try {
      progressRecords = await UserProgress.findAll({
        where: { user: userId },
        order: [['attemptedAt', 'DESC']],
        limit: 100,
      });
    } catch (err) {
      logger.warn('Failed to fetch UserProgress, checking QuizAttempt fallback', { userId, error: err.message });
    }

    // Fallback or blend with QuizAttempt
    let attempts = [];
    if (progressRecords.length === 0) {
      try {
        attempts = await QuizAttempt.findAll({
          where: { user: userId },
          order: [['createdAt', 'DESC']],
          limit: 100,
        });
      } catch (err) {
        logger.warn('Failed to fetch QuizAttempt fallback', { userId, error: err.message });
      }
    }

    const topicStats = {};
    let totalScoreSum = 0;
    let totalAttemptsCount = 0;

    // Process UserProgress
    progressRecords.forEach((rec) => {
      const topic = rec.topic || 'General';
      if (!topicStats[topic]) {
        topicStats[topic] = { totalPercentage: 0, count: 0, lastDifficulty: rec.difficulty };
      }
      topicStats[topic].totalPercentage += rec.percentage;
      topicStats[topic].count += 1;
      totalScoreSum += rec.percentage;
      totalAttemptsCount += 1;
    });

    // Process QuizAttempt fallback
    attempts.forEach((att) => {
      const topic = (att.weakTopics && att.weakTopics[0]) || 'General Topic';
      const pct = att.totalQuestions > 0 ? (att.score / att.totalQuestions) * 100 : 70;
      if (!topicStats[topic]) {
        topicStats[topic] = { totalPercentage: 0, count: 0, lastDifficulty: 'medium' };
      }
      topicStats[topic].totalPercentage += pct;
      topicStats[topic].count += 1;
      totalScoreSum += pct;
      totalAttemptsCount += 1;
    });

    const topicScores = {};
    const weakTopics = [];
    const strongTopics = [];

    Object.entries(topicStats).forEach(([topic, stat]) => {
      const avg = Math.round((stat.totalPercentage / stat.count) * 10) / 10;
      topicScores[topic] = avg;

      if (avg < 70) {
        weakTopics.push({ topic, averageScore: avg, priority: 'high' });
      } else if (avg >= 80) {
        strongTopics.push({ topic, averageScore: avg });
      }
    });

    const overallAccuracy =
      totalAttemptsCount > 0 ? Math.round((totalScoreSum / totalAttemptsCount) * 10) / 10 : 75;

    return {
      userId,
      overallAccuracy,
      totalAttempts: totalAttemptsCount,
      topicScores,
      weakTopics,
      strongTopics,
    };
  }

  /**
   * Generates top personalized quiz recommendations for a user.
   * @param {string} userId - Target user ID.
   * @param {Object} options
   * @param {number} [options.timeBudget] - Max time budget in minutes.
   * @param {number} [options.limit=5] - Number of recommendations to return.
   * @param {string} [options.topicFilter] - Optional specific topic filter.
   * @returns {Promise<{ userProfile: Object, recommendations: Array }>}
   */
  async getRecommendedQuizzes(userId, options = {}) {
    const limit = options.limit || 5;
    const timeBudget = options.timeBudget ? parseInt(options.timeBudget, 10) : null;
    const topicFilter = options.topicFilter || null;

    const profile = await this.getUserPerformanceProfile(userId);

    // Fetch database quizzes if available
    let dbQuizzes = [];
    try {
      dbQuizzes = await Quiz.findAll({ limit: 50 });
    } catch (err) {
      logger.warn('Failed to load DB Quizzes for recommendation, using catalog', { error: err.message });
    }

    const availableQuizzes = dbQuizzes.length > 0 ? dbQuizzes.map(this.formatDbQuiz) : CANDIDATE_QUIZ_CATALOG;

    // Filter by topic if requested
    let filteredQuizzes = availableQuizzes;
    if (topicFilter) {
      filteredQuizzes = availableQuizzes.filter(
        (q) => (q.topic || '').toLowerCase() === topicFilter.toLowerCase()
      );
    }

    // Filter by time budget if requested
    if (timeBudget && !isNaN(timeBudget)) {
      filteredQuizzes = filteredQuizzes.filter(
        (q) => (q.estimatedMinutes || 10) <= timeBudget + 5
      );
    }

    // Fallback to full list if filters leave empty set
    if (filteredQuizzes.length === 0) {
      filteredQuizzes = availableQuizzes;
    }

    // Score each quiz against user performance vector
    const scoredQuizzes = filteredQuizzes.map((quiz) => {
      const matchScore = this.calculateRecommendationScore(quiz, profile, timeBudget);
      return {
        ...quiz,
        recommendationScore: matchScore.score,
        matchReason: matchScore.reason,
      };
    });

    // Sort descending by recommendationScore
    scoredQuizzes.sort((a, b) => b.recommendationScore - a.recommendationScore);

    const topRecommendations = scoredQuizzes.slice(0, limit);

    logger.info('Generated quiz recommendations', {
      userId,
      count: topRecommendations.length,
      timeBudget,
    });

    return {
      userId,
      userProfile: {
        overallAccuracy: profile.overallAccuracy,
        totalAttempts: profile.totalAttempts,
        weakTopics: profile.weakTopics.map((w) => w.topic),
        strongTopics: profile.strongTopics.map((s) => s.topic),
      },
      recommendations: topRecommendations,
    };
  }

  /**
   * Calculates recommendation score (0-100) and rationale for a quiz.
   */
  calculateRecommendationScore(quiz, profile, timeBudget) {
    let score = 70; // baseline score
    const reasons = [];

    const topicAccuracy = profile.topicScores[quiz.topic];

    // Weakness targeting (+25 points)
    if (topicAccuracy !== undefined && topicAccuracy < 70) {
      score += 25;
      reasons.push(`Targets your weak topic: ${quiz.topic} (${topicAccuracy}% accuracy)`);
    } else if (profile.weakTopics.some((w) => w.topic === quiz.topic)) {
      score += 20;
      reasons.push(`Focuses on your priority improvement area: ${quiz.topic}`);
    } else if (topicAccuracy === undefined) {
      score += 10;
      reasons.push(`New topic exploration: ${quiz.topic}`);
    }

    // Difficulty scaling suitability (+15 points)
    const userAcc = profile.overallAccuracy;
    if (userAcc < 65 && quiz.difficulty === 'easy') {
      score += 15;
      reasons.push('Easy difficulty suitable for building confidence');
    } else if (userAcc >= 65 && userAcc < 85 && quiz.difficulty === 'medium') {
      score += 15;
      reasons.push('Medium difficulty aligned with your current skill level');
    } else if (userAcc >= 85 && quiz.difficulty === 'hard') {
      score += 15;
      reasons.push('Hard difficulty challenge matched for your high accuracy');
    }

    // Time budget match (+15 points)
    if (timeBudget && quiz.estimatedMinutes) {
      const diff = Math.abs(quiz.estimatedMinutes - timeBudget);
      if (diff <= 3) {
        score += 15;
        reasons.push(`Fits your requested ${timeBudget}-minute session time`);
      } else if (quiz.estimatedMinutes <= timeBudget) {
        score += 10;
        reasons.push(`Fits within your ${timeBudget}-minute time budget`);
      }
    }

    const finalScore = Math.min(Math.max(score, 50), 99);
    const mainReason = reasons.length > 0 ? reasons.join('. ') : `Recommended quiz based on overall prep goals.`;

    return {
      score: finalScore,
      reason: mainReason,
    };
  }

  formatDbQuiz(q) {
    return {
      id: q.id,
      title: q.title || 'Practice Quiz',
      topic: q.topic || q.subject || 'General Knowledge',
      subject: q.subject || 'General',
      difficulty: q.difficulty || 'medium',
      totalQuestions: (q.questions && q.questions.length) || 10,
      estimatedMinutes: q.timeLimit ? Math.round(q.timeLimit / 60) : 10,
      description: q.description || 'Personalized quiz evaluation.',
    };
  }

  /**
   * Logs a recommendation hit/click event for future model improvements.
   */
  async recordRecommendationHit(userId, quizId, metadata = {}) {
    logger.info('Recommendation hit recorded', { userId, quizId, metadata });

    try {
      if (ActivityLog) {
        await ActivityLog.create({
          user: userId,
          action: 'RECOMMENDATION_HIT',
          details: { quizId, ...metadata },
        });
      }
    } catch (err) {
      logger.warn('Failed to record recommendation hit in ActivityLog', { userId, quizId, error: err.message });
    }

    return { success: true, loggedAt: new Date().toISOString() };
  }
}

module.exports = new QuizRecommendationService();

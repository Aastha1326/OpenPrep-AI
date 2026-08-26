const { User, UserBadge, QuizAttempt, Sequelize } = require('../models');
const { Op } = require('sequelize');
const redisService = require('./redisService');
const logger = require('../utils/logger');

/**
 * Service for managing global gamification leaderboard ranks and point calculations.
 */

/**
 * Calculates total gamification points for a given user metrics object.
 */
exports.calculateUserPoints = (user, userBadgesCount = 0, quizAttemptsCount = 0) => {
  const xp = user.xp || 0;
  const streakBonus = (user.currentStreak || 0) * 15;
  const badgeBonus = userBadgesCount * 100;
  const quizBonus = quizAttemptsCount * 25;

  return xp + streakBonus + badgeBonus + quizBonus;
};

/**
 * Fetches ranked leaderboard participants for a given timeframe ('weekly', 'monthly', 'all').
 */
exports.getLeaderboard = async (timeframe = 'all', limit = 50, currentUserId = null) => {
  try {
    // Attempt Redis cache hit for global leaderboard
    const cacheKey = `leaderboard:${timeframe}:${limit}`;
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      if (parsed && Array.isArray(parsed.leaderboard)) {
        let currentUserRank = null;
        if (currentUserId) {
          currentUserRank = parsed.leaderboard.find((entry) => entry.userId === currentUserId) || null;
        }
        return {
          success: true,
          leaderboard: parsed.leaderboard,
          currentUserRank,
          cached: true,
        };
      }
    }

    // DB Aggregation fallback
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'avatar', 'xp', 'currentStreak', 'role', 'createdAt', 'updatedAt'],
      include: [
        {
          model: UserBadge,
          as: 'badgesRef',
          attributes: ['id', 'badgeCode'],
        },
      ],
      limit: Math.min(200, limit * 2),
    });

    const leaderboardEntries = await Promise.all(
      users.map(async (user) => {
        let quizCount = 0;
        try {
          if (QuizAttempt) {
            quizCount = await QuizAttempt.count({ where: { user: user.id } });
          }
        } catch (e) {}

        const badgesCount = user.badgesRef ? user.badgesRef.length : 0;
        const totalPoints = exports.calculateUserPoints(user, badgesCount, quizCount);

        return {
          userId: user.id,
          name: user.name || 'Student',
          email: user.email,
          avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
          xp: user.xp || 0,
          currentStreak: user.currentStreak || 0,
          badgesCount,
          quizzesCompleted: quizCount,
          totalPoints,
          role: user.role,
        };
      })
    );

    // Sort by total points descending
    leaderboardEntries.sort((a, b) => b.totalPoints - a.totalPoints);

    // Assign rank and podium metadata
    const rankedList = leaderboardEntries.slice(0, limit).map((entry, index) => {
      const rank = index + 1;
      let badgeTag = null;
      if (rank === 1) badgeTag = '🥇 Gold Champion';
      else if (rank === 2) badgeTag = '🥈 Silver Competitor';
      else if (rank === 3) badgeTag = '🥉 Bronze Achiever';

      return {
        ...entry,
        rank,
        badgeTag,
      };
    });

    // Locate current user rank
    let currentUserRank = null;
    if (currentUserId) {
      const userIndex = leaderboardEntries.findIndex((e) => e.userId === currentUserId);
      if (userIndex !== -1) {
        currentUserRank = {
          ...leaderboardEntries[userIndex],
          rank: userIndex + 1,
        };
      }
    }

    const responsePayload = {
      leaderboard: rankedList,
      totalParticipants: leaderboardEntries.length,
      generatedAt: new Date().toISOString(),
    };

    // Cache in Redis for 5 minutes
    await redisService.set(cacheKey, JSON.stringify(responsePayload), 300);

    return {
      success: true,
      ...responsePayload,
      currentUserRank,
      cached: false,
    };
  } catch (error) {
    logger.error('Failed to generate leaderboard rankings', { error: error.message });
    throw error;
  }
};

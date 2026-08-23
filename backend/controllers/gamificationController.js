/**
 * @fileoverview Controller for managing gamification dashboard and leaderboard data.
 */
const gamificationService = require('../services/gamificationService');

/**
 * Processes a user action and returns updated gamification stats.
 */
const recordAction = async (req, res) => {
  try {
    const { actionType, count } = req.body;
    // const userId = req.user.id;

    if (!actionType || typeof count !== 'number') {
      return res.status(400).json({ success: false, message: 'Valid actionType and count are required.' });
    }

    const result = await gamificationService.processUserAction('mock-user-id', actionType, count);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error recording action:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * Fetches the user's dashboard stats and the global leaderboard.
 */
const getDashboardData = async (req, res) => {
  try {
    const { timeframe } = req.query;
    
    // Mock user stats
    const userStats = {
      currentStreak: 5,
      longestStreak: 12,
      totalXP: 4500,
      unlockedBadges: [
        { type: 'streak_3', name: 'Getting Started', icon: '🔥' },
        { type: 'quiz_master', name: 'Quiz Master', icon: '🏆' }
      ]
    };

    const leaderboard = await gamificationService.getLeaderboard(timeframe);

    res.status(200).json({
      success: true,
      data: {
        userStats,
        leaderboard,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  recordAction,
  getDashboardData,
};


const { User, UserBadge, Badge } = require('../models');

exports.getSummary = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const badges = await UserBadge.findAll({
      where: { userId: user.id },
      include: [
        {
          model: Badge,
          as: 'badge',
          where: { isActive: true },
          required: false,
        },
      ],
      order: [['unlockedAt', 'DESC']],
    });

    const nextLevelXP = Math.pow(user.level, 2) * 100;

    res.status(200).json({
      success: true,
      data: {
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        streakFreezesAvailable: user.streakFreezesAvailable,
        nextLevelXP,
        badges: badges.map((b) => ({
          id: b.id,
          badgeCode: b.badgeCode,
          unlockedAt: b.unlockedAt,
          title: b.badge?.name || 'Achievement Unlocked',
          description: b.badge?.description || 'Earned a study achievement badge.',
          svgIcon: b.badge?.svgIcon || null,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.useStreakFreeze = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.streakFreezesAvailable <= 0) {
      return res.status(400).json({ success: false, error: 'No streak freezes available' });
    }

    user.streakFreezesAvailable -= 1;

    // Set lastActivityDate to today in user's timezone to freeze the streak (IANA-aware)
    const now = new Date();
    let todayStr;
    if (req.headers['x-timezone']) {
      const { getLocalDateString } = require('../utils/streakCalculator');
      todayStr = getLocalDateString(now, req.headers['x-timezone']);
    } else {
      const timezoneOffset = Number(req.headers['x-timezone-offset']) || 0;
      const localTime = new Date(now.getTime() - timezoneOffset * 60 * 1000);
      todayStr = localTime.toISOString().split('T')[0];
    }

    user.lastActivityDate = todayStr;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Streak freeze consumed successfully.',
      data: {
        streakFreezesAvailable: user.streakFreezesAvailable,
        currentStreak: user.currentStreak,
      },
    });
  } catch (error) {
    next(error);
  }
};

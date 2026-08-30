const { User, ActivityLog } = require('../models');
const streakCalculator = require('../utils/streakCalculator');
const gamificationService = require('../services/gamificationService');
const { Op } = require('sequelize');

/**
 * @desc    Get streak summary
 * @route   GET /api/streaks/summary
 * @access  Private
 */
exports.getStreakSummary = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Track study minutes (based on studyHours), XP, and streak info
    return res.status(200).json({
      success: true,
      data: {
        currentStreak: user.currentStreak || user.streakCount || 0,
        longestStreak: user.longestStreak || 0,
        xp: user.xp || 0,
        studyMinutes: Math.round((user.studyHours || 0) * 60),
        lastActivityDate: user.lastActivityDate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get 90-day activity heatmap
 * @route   GET /api/streaks/heatmap
 * @access  Private
 */
exports.getHeatmap = async (req, res, next) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const logs = await ActivityLog.findAll({
      where: {
        user: req.user.id,
        timestamp: { [Op.gte]: ninetyDaysAgo }
      },
      attributes: ['timestamp'],
      order: [['timestamp', 'ASC']]
    });

    const heatmapData = {};
    for (const log of logs) {
      const dateStr = log.timestamp.toISOString().split('T')[0];
      heatmapData[dateStr] = (heatmapData[dateStr] || 0) + 1;
    }

    return res.status(200).json({
      success: true,
      data: heatmapData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get 12-week consistency analytics
 * @route   GET /api/streaks/analytics
 * @access  Private
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks * 7 days

    const logs = await ActivityLog.findAll({
      where: {
        user: req.user.id,
        timestamp: { [Op.gte]: twelveWeeksAgo }
      },
      attributes: ['timestamp']
    });

    // Group by week (0-11)
    const weeks = Array(12).fill(0);
    const now = new Date();
    
    logs.forEach(log => {
      const diffTime = Math.abs(now - log.timestamp);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const weekIndex = 11 - Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < 12) {
        weeks[weekIndex] += 1;
      }
    });

    // Calculate weekly consistency percentages (assuming 1 activity = 1 day active for simplicity, 
    // max 7 days a week. We need unique days per week)
    const uniqueDaysPerWeek = Array(12).fill().map(() => new Set());
    logs.forEach(log => {
      const diffTime = Math.abs(now - log.timestamp);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const weekIndex = 11 - Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < 12) {
        uniqueDaysPerWeek[weekIndex].add(log.timestamp.toISOString().split('T')[0]);
      }
    });

    const weeklyConsistencyPercentages = uniqueDaysPerWeek.map(daysSet => Math.round((daysSet.size / 7) * 100));

    return res.status(200).json({
      success: true,
      data: {
        weeklyActivityCounts: weeks,
        weeklyConsistencyPercentages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get streak maintenance probabilities
 * @route   GET /api/streaks/probability
 * @access  Private
 */
exports.getProbability = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Simple heuristic for maintenance probability based on current streak
    const currentStreak = user.currentStreak || user.streakCount || 0;
    
    let prob7Day = 30; // base probability 30%
    let prob30Day = 10; // base probability 10%
    
    if (currentStreak > 7) {
      prob7Day = Math.min(95, 50 + (currentStreak * 2));
      prob30Day = Math.min(80, 20 + (currentStreak));
    } else if (currentStreak > 0) {
      prob7Day = 30 + (currentStreak * 5);
      prob30Day = 10 + (currentStreak * 2);
    }

    return res.status(200).json({
      success: true,
      data: {
        sevenDayProbability: prob7Day,
        thirtyDayProbability: prob30Day
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get personalized streak recommendations
 * @route   GET /api/streaks/recommendations
 * @access  Private
 */
exports.getRecommendations = async (req, res, next) => {
  try {
    const recommendations = [
      {
        title: 'Review 10 Flashcards',
        type: 'flashcard_review',
        description: 'A quick 5-minute session to keep your streak alive today.',
        actionUrl: '/flashcards'
      },
      {
        title: 'Attempt a Daily Quiz',
        type: 'quiz_attempt',
        description: 'Challenge yourself and earn XP while extending your streak.',
        actionUrl: '/quizzes'
      },
      {
        title: 'Upload a PYQ',
        type: 'pyq_upload',
        description: 'Contribute to the community to maintain your activity.',
        actionUrl: '/pyq'
      }
    ];

    return res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Quickly log an activity to maintain streak
 * @route   POST /api/streaks/log
 * @access  Private
 */
exports.logActivity = async (req, res, next) => {
  try {
    const { activityType, description } = req.body;
    
    if (!activityType) {
      return res.status(400).json({ success: false, message: 'activityType is required' });
    }

    // 1. Log the activity
    await ActivityLog.create({
      user: req.user.id,
      activityType,
      description: description || `Quick logged ${activityType}`
    });

    // 2. Update streak using the existing method (if it exists)
    const timeZoneParam = req.headers['x-timezone'] || req.headers['x-timezone-offset'];
    
    if (gamificationService.updateStreak) {
      await gamificationService.updateStreak(req.user.id, timeZoneParam);
    } else {
      // Fallback: manually update streak logic if the method is missing in the object structure
      const user = await User.findByPk(req.user.id);
      const localDate = streakCalculator.getLocalDateString(new Date(), timeZoneParam);
      
      if (user.lastActivityDate !== localDate) {
        user.lastActivityDate = localDate;
        user.currentStreak = (user.currentStreak || user.streakCount || 0) + 1;
        user.streakCount = user.currentStreak;
        if (user.currentStreak > (user.longestStreak || 0)) {
          user.longestStreak = user.currentStreak;
        }
        await user.save();
      }
    }

    // Return the updated summary
    const updatedUser = await User.findByPk(req.user.id);
    return res.status(200).json({
      success: true,
      data: {
        currentStreak: updatedUser.currentStreak || updatedUser.streakCount || 0,
        longestStreak: updatedUser.longestStreak || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

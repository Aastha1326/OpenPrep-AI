const gamificationService = require('../services/gamificationService');
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const User = require('../models/User');

/**
 * @desc    Get current user gamification overview (XP, Level, Badges, Freezes)
 * @route   GET /api/gamification/status
 * @access  Private
 */
exports.getGamificationStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const levelInfo = gamificationService.getLevelInfo(user.xp || 0);
    const userBadges = await UserBadge.findAll({
      where: { userId: user.id },
      include: [{ model: Badge, as: 'badge' }],
    });

    return res.json({
      success: true,
      data: {
        ...levelInfo,
        streakCount: user.streakCount || 0,
        streakFreezes: user.streakFreezes || 0,
        badges: userBadges,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Purchase a streak freeze with XP
 * @route   POST /api/gamification/streak-freeze/buy
 * @access  Private
 */
exports.buyStreakFreeze = async (req, res) => {
  try {
    const result = await gamificationService.purchaseStreakFreeze(req.user.id);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

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

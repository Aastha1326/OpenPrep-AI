const { User, UserBadge } = require('../models');

// Helper to get badge titles
function getBadgeTitle(code) {
  const titles = {
    seven_day_streak: '7-Day Streak 🔥',
    night_owl: 'Night Owl 🦉',
    quiz_master: 'Quiz Master 🎓',
  };
  return titles[code] || 'Achievement Unlocked';
}

// Helper to get badge descriptions
function getBadgeDescription(code) {
  const descriptions = {
    seven_day_streak: 'Studied consistently for 7 consecutive days.',
    night_owl: 'Completed a study task between 11 PM and 4 AM.',
    quiz_master: 'Successfully finished 10 quiz attempts.',
  };
  return descriptions[code] || 'Earned a study achievement badge.';
}

exports.getSummary = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const badges = await UserBadge.findAll({
      where: { userId: user.id },
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
          title: getBadgeTitle(b.badgeCode),
          description: getBadgeDescription(b.badgeCode),
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

    // Set lastActivityDate to today in user's timezone to freeze the streak
    const now = new Date();
    const timezoneOffset = Number(req.headers['x-timezone-offset']) || 0;
    const localTime = new Date(now.getTime() - timezoneOffset * 60 * 1000);
    const todayStr = localTime.toISOString().split('T')[0];

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

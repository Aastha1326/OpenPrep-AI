const { User, UserBadge, QuizAttempt } = require('../models');

// Calculate level based on XP: level = Math.floor(Math.sqrt(xp / 100)) + 1
function calculateLevel(xp) {
  if (!xp || xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// XP required to reach the next level
function getNextLevelXP(level) {
  return Math.pow(level, 2) * 100;
}

/**
 * Handle XP award and level up check.
 * Maximum XP per hour cap: 500 XP to prevent exploitation.
 */
async function awardXP(userId, amount, reason) {
  const user = await User.findByPk(userId);
  if (!user) return { leveledUp: false, newLevel: 1 };

  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  // Implement hourly XP cap to prevent spamming
  const cacheService = require('./cacheService'); // Or handle inline
  const hourlyKey = `xp_earned:${userId}:${Math.floor(now / (60 * 60 * 1000))}`;
  
  let hourlyXP = 0;
  try {
    const cached = await cacheService.get(hourlyKey);
    hourlyXP = cached ? parseInt(cached, 10) : 0;
  } catch (e) {
    // Cache service fallback
  }

  if (hourlyXP >= 500) {
    console.log(`XP award capped for user ${userId} due to hourly limit.`);
    return {
      leveledUp: false,
      xp: user.xp,
      level: user.level,
      message: 'Hourly XP limit reached',
    };
  }

  const allowedAmount = Math.min(amount, 500 - hourlyXP);
  if (allowedAmount <= 0) {
    return { leveledUp: false, xp: user.xp, level: user.level };
  }

  try {
    const cacheService = require('./cacheService');
    await cacheService.set(hourlyKey, String(hourlyXP + allowedAmount), 3600);
  } catch (e) {
    // Cache service fallback
  }

  const previousLevel = user.level || 1;
  user.xp = (user.xp || 0) + allowedAmount;
  const currentLevel = calculateLevel(user.xp);
  
  let leveledUp = false;
  if (currentLevel > previousLevel) {
    user.level = currentLevel;
    user.skillPoints = (user.skillPoints || 0) + (currentLevel - previousLevel);
    leveledUp = true;
  }

  await user.save();

  return {
    xp: user.xp,
    level: user.level,
    leveledUp,
    nextLevelXP: getNextLevelXP(user.level),
  };
}

/**
 * Update the user's daily study streak.
 * @param {string} userId
 * @param {number} timezoneOffsetMinutes - client's offset in minutes (e.g. -330 for UTC+5:30)
 */
async function updateStreak(userId, timezoneOffsetMinutes = 0) {
  const user = await User.findByPk(userId);
  if (!user) return null;

  const now = new Date();
  
  // Get local date representation based on user's timezone offset
  const localTime = new Date(now.getTime() - timezoneOffsetMinutes * 60 * 1000);
  const todayStr = localTime.toISOString().split('T')[0];

  const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : null;

  if (!lastActivity) {
    user.currentStreak = 1;
    user.longestStreak = 1;
  } else {
    // Calculate elapsed hours between now and last activity
    const elapsedHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (elapsedHours >= 24 && elapsedHours <= 48) {
      user.currentStreak += 1;
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
      }
    } else if (elapsedHours > 48) {
      // Check if they have a streak freeze shield available
      if (user.streakFreezesAvailable > 0) {
        user.streakFreezesAvailable -= 1;
        // Streak is preserved and continues
        user.currentStreak += 1;
        if (user.currentStreak > user.longestStreak) {
          user.longestStreak = user.currentStreak;
        }
      } else {
        user.currentStreak = 1; // Reset to 1 for today's activity
      }
    } else {
      // Completed in under 24 hours — already checked today, keep current streak
    }
  }

  user.lastActivityDate = todayStr;
  await user.save();

  // Also check if streak unlocks "7-Day Streak" badge
  const unlockedBadges = await checkAndUnlockBadges(user, 'streak_check');

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    streakFreezesAvailable: user.streakFreezesAvailable,
    unlockedBadges,
  };
}

/**
 * Check badge criteria and unlock achievements
 */
async function checkAndUnlockBadges(user, activityType, details = {}) {
  const newUnlocks = [];

  const checkAndCreateBadge = async (badgeCode) => {
    const existing = await UserBadge.findOne({
      where: { userId: user.id, badgeCode },
    });
    if (!existing) {
      const badge = await UserBadge.create({
        userId: user.id,
        badgeCode,
        unlockedAt: new Date(),
      });
      newUnlocks.push({
        badgeCode,
        title: getBadgeTitle(badgeCode),
        description: getBadgeDescription(badgeCode),
      });
    }
  };

  // 1. "7-Day Streak" badge
  if (user.currentStreak >= 7) {
    await checkAndCreateBadge('seven_day_streak');
  }

  // 2. "Night Owl" badge: activity between 11 PM and 4 AM user local time
  const offset = details.timezoneOffsetMinutes || 0;
  const localHour = new Date(Date.now() - offset * 60 * 1000).getHours();
  if (localHour >= 23 || localHour < 4) {
    await checkAndCreateBadge('night_owl');
  }

  // 3. "Quiz Master" badge: completed at least 10 quizzes
  if (activityType === 'quiz_complete') {
    const quizCount = await QuizAttempt.count({
      where: { user: user.id },
    });
    if (quizCount >= 10) {
      await checkAndCreateBadge('quiz_master');
    }
  }

  return newUnlocks;
}

function getBadgeTitle(code) {
  const titles = {
    seven_day_streak: '7-Day Streak 🔥',
    night_owl: 'Night Owl 🦉',
    quiz_master: 'Quiz Master 🎓',
  };
  return titles[code] || 'Achievement Unlocked';
}

function getBadgeDescription(code) {
  const descriptions = {
    seven_day_streak: 'Studied consistently for 7 consecutive days.',
    night_owl: 'Completed a study task between 11 PM and 4 AM.',
    quiz_master: 'Successfully finished 10 quiz attempts.',
  };
  return descriptions[code] || 'Earned a study achievement badge.';
}

module.exports = {
  calculateLevel,
  getNextLevelXP,
  awardXP,
  updateStreak,
  checkAndUnlockBadges,
};

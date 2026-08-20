const { User, UserBadge, QuizAttempt, SquadMember, SquadChallenge, SquadChallengeContribution, SquadAchievement } = require('../models');
const { checkAndAwardBadges } = require('./achievementService');
const { createNotification } = require('./notificationService');
let logSquadActivity = async () => {};
try {
  const squadSvc = require('./squadActivityService');
  logSquadActivity = squadSvc.logSquadActivity;
} catch (e) {
  // squadActivityService unavailable (e.g. test environment)
}
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

  // Distribute XP to active squad challenges
  try {
    const memberships = await SquadMember.findAll({ where: { userId } });
    if (memberships.length > 0) {
      const squadIds = memberships.map(m => m.squadId);
      const activeChallenges = await SquadChallenge.findAll({
        where: {
          squadId: squadIds,
          status: 'active'
        }
      });

      for (const challenge of activeChallenges) {
        challenge.currentXp += allowedAmount;
        if (challenge.currentXp >= challenge.targetXp) {
          challenge.currentXp = challenge.targetXp;
          challenge.status = 'completed';
          
          // Award achievement to the squad
          await SquadAchievement.findOrCreate({
            where: { squadId: challenge.squadId, badgeCode: 'challenge_completed' },
            defaults: { unlockedAt: new Date() }
          });

          // If io is available globally, we can emit an event
          if (global.io) {
            global.io.to(`squad:${challenge.squadId}`).emit('squad:challenge_completed', {
              squadId: challenge.squadId,
              challengeId: challenge.id
            });
          }
        }
        await challenge.save();

        // Update individual contribution
        const [contribution] = await SquadChallengeContribution.findOrCreate({
          where: { challengeId: challenge.id, userId },
          defaults: { contributedXp: 0 }
        });
        contribution.contributedXp += allowedAmount;
        await contribution.save();

        // Update real-time progress
        if (global.io) {
          global.io.to(`squad:${challenge.squadId}`).emit('squad:progress_updated', {
            squadId: challenge.squadId,
            challengeId: challenge.id,
            currentXp: challenge.currentXp,
            targetXp: challenge.targetXp,
            contributions: {
              userId,
              amount: contribution.contributedXp
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating squad challenge XP:', error);
  }

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

  // Convert the current UTC time to the user's local calendar date.
  const localTime = new Date(
    now.getTime() - timezoneOffsetMinutes * 60 * 1000
  );

  const todayStr = localTime.toISOString().split('T')[0];

  const toUtcDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };

  const lastActivityStr = user.lastActivityDate
    ? String(user.lastActivityDate).slice(0, 10)
    : null;

  if (!lastActivityStr) {
    user.currentStreak = 1;
    user.longestStreak = 1;
  } else if (lastActivityStr !== todayStr) {
    const daysSinceLastActivity = Math.round(
      (toUtcDate(todayStr) - toUtcDate(lastActivityStr)) /
        (24 * 60 * 60 * 1000)
    );

    if (daysSinceLastActivity === 1) {
      // Studied on consecutive days.
      user.currentStreak = (user.currentStreak || 0) + 1;
    } else if (daysSinceLastActivity === 2) {
      // Exactly one missed study day: automatically consume one freeze.
      if ((user.streakFreezesAvailable || 0) > 0) {
        user.streakFreezesAvailable -= 1;
        user.currentStreak = (user.currentStreak || 0) + 1;
      } else {
        user.currentStreak = 1;
      }
    } else if (daysSinceLastActivity > 2) {
      // More than one missed day cannot be covered by a single freeze.
      user.currentStreak = 1;
    }
  }

  user.currentStreak = Math.max(1, user.currentStreak || 1);
  user.longestStreak = Math.max(
    user.longestStreak || 0,
    user.currentStreak
  );

  user.lastActivityDate = todayStr;
  user.streakCount = user.currentStreak;
  user.streakLastActive = now;

  await user.save();

  const unlockedBadges = await checkAndUnlockBadges(user, 'streak_check', {
    timezoneOffsetMinutes,
  });

  // Issue #1053: Check for Week Warrior badge
  try {
    await checkAndAwardBadges(userId, {
      type: 'STREAK_UPDATED',
      payload: { streakDays: user.currentStreak },
    });
  } catch (e) {
    // Graceful fallback if achievement service DB query is unavailable
  }

  // Issue #764: Post a "Streak hit" milestone to the user's study squad feeds
  if (user.currentStreak >= 7 && user.currentStreak % 7 === 0) {
    await logSquadActivity(userId, 'streak_hit', `hit a ${user.currentStreak}-day study streak 🔥`);
  }

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

const freezeRewardBadges = new Set([
  'seven_day_streak',
  'thirty_day_streak',
  'hundred_day_streak',
]);

if (freezeRewardBadges.has(badgeCode)) {
  user.streakFreezesAvailable =
    (user.streakFreezesAvailable || 0) + 1;

  await user.save();
}

newUnlocks.push({
  badgeCode,
  title: getBadgeTitle(badgeCode),
  description: getBadgeDescription(badgeCode),
  freezeReward: freezeRewardBadges.has(badgeCode) ? 1 : 0,
});

try {
  await createNotification(
    user.id,
    `Badge Earned: ${getBadgeTitle(badgeCode)}`,
    getBadgeDescription(badgeCode),
    'badge_earned',
    '/dashboard',
    global.io
  );
} catch (err) {
  // Notification creation error fallback
}

    }
  };

// Streak milestone badges also award one Streak Freeze token.
// The badge check prevents the reward from being granted more than once.
if (user.currentStreak >= 7) {
  await checkAndCreateBadge('seven_day_streak');
}

if (user.currentStreak >= 30) {
  await checkAndCreateBadge('thirty_day_streak');
}

if (user.currentStreak >= 100) {
  await checkAndCreateBadge('hundred_day_streak');
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
  thirty_day_streak: '30-Day Streak 🏆',
  hundred_day_streak: '100-Day Streak 💎',
  night_owl: 'Night Owl 🦉',
  quiz_master: 'Quiz Master 🎓',
  week_warrior: 'Week Warrior 🔥',
  card_collector: 'Card Collector 📚',
  sharpshooter: 'Sharpshooter 🎯',
  early_bird: 'Early Bird 🌅',
  century_club: 'Century Club 💯',
  pyq_analyst: 'PYQ Analyst 🏆',
  study_marathon: 'Study Marathon ⏰',
  perfect_score: 'Perfect Score ⭐',
};  return titles[code] || 'Achievement Unlocked';
}

function getBadgeDescription(code) {
const descriptions = {
  seven_day_streak:
    'Studied consistently for 7 consecutive days. Earned 1 Streak Freeze.',
  thirty_day_streak:
    'Maintained a 30-day study streak. Earned 1 Streak Freeze.',
  hundred_day_streak:
    'Maintained an incredible 100-day study streak. Earned 1 Streak Freeze.',
  night_owl: 'Completed a study task between 11 PM and 4 AM.',
  quiz_master: 'Successfully finished 10 quiz attempts.',
  week_warrior: 'Achieve a 7-day study streak',
  card_collector: 'Create 50 flashcards',
  sharpshooter: 'Complete 3 consecutive quizzes with a score above 85%',
  early_bird: 'Log a study session before 7 AM',
  century_club: 'Review 100 flashcards in one session',
  pyq_analyst: 'Analyze 5 PYQ PDFs',
  study_marathon: 'Study for 10+ hours in a single session',
  perfect_score: 'Achieve 100% on multiple quizzes',
};  return descriptions[code] || 'Earned a study achievement badge.';
}

module.exports = {
  calculateLevel,
  getNextLevelXP,
  awardXP,
  updateStreak,
  checkAndUnlockBadges,
};

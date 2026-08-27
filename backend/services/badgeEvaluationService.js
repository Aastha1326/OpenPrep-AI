const cron = require('node-cron');
const { User, Badge, UserBadge, Achievement, QuizAttempt, Flashcard, FocusSession, Note, Notification } = require('../models');
const { BADGE_LIST } = require('../config/badges');

/**
 * Evaluates user activity metrics against badge criteria and awards newly unlocked badges.
 *
 * @param {string} [specificUserId] - Optional user ID to evaluate a single user immediately.
 * @returns {Promise<Array<Object>>} - List of newly awarded badge records.
 */
async function evaluateAllUserBadges(specificUserId = null) {
  try {
    // Ensure standard badges are present in the Badge table
    for (const bConfig of BADGE_LIST) {
      await Badge.findOrCreate({
        where: { id: bConfig.id },
        defaults: {
          id: bConfig.id,
          name: bConfig.name,
          description: bConfig.description,
          icon: bConfig.icon,
          svgIcon: bConfig.svgIcon || null,
          category: bConfig.category || 'achievement',
          criteriaType: bConfig.criteriaType || 'streak_days',
          criteriaThreshold: bConfig.criteriaThreshold || 1,
          isActive: true,
        },
      });
    }

    const whereClause = specificUserId ? { id: specificUserId } : {};
    const users = await User.findAll({ where: whereClause, attributes: ['id', 'currentStreak', 'xp'] });
    const allBadges = await Badge.findAll({ where: { isActive: true } });

    const newlyAwardedBadges = [];

    for (const user of users) {
      const userId = user.id;

      // 1. Gather user activity metrics across system
      const streakDays = user.currentStreak || 0;

      const safeCount = async (model, where) => {
        try {
          return model?.count ? (await model.count({ where })) || 0 : 0;
        } catch (_e) {
          return 0;
        }
      };

      const safeSum = async (model, col, where) => {
        try {
          return model?.sum ? (await model.sum(col, { where })) || 0 : 0;
        } catch (_e) {
          return 0;
        }
      };

      const quizzesCompleted = await safeCount(QuizAttempt, { user: userId });
      const perfectQuizzes = await safeCount(QuizAttempt, { user: userId, score: 100 });
      const flashcardsCreated = await safeCount(Flashcard, { user: userId });
      const flashcardsReviewed = await safeSum(Flashcard, 'timesReviewed', { user: userId });
      const focusMinutes = await safeSum(FocusSession, 'duration', { userId, completed: true });
      const notesCreated = await safeCount(Note, { user: userId });

      const userMetrics = {
        streak_days: streakDays,
        quizzes_completed: quizzesCompleted,
        perfect_quizzes: perfectQuizzes,
        flashcards_created: flashcardsCreated,
        flashcards_reviewed: flashcardsReviewed,
        focus_minutes: focusMinutes,
        notes_created: notesCreated,
      };

      // 2. Fetch user's existing unlocked badges
      const existingUserBadges = await UserBadge.findAll({ where: { userId } });
      const unlockedBadgeCodes = new Set(existingUserBadges.map((b) => b.badgeCode));

      // 3. Evaluate each active badge definition
      for (const badge of allBadges) {
        if (unlockedBadgeCodes.has(badge.id)) continue;

        const currentVal = userMetrics[badge.criteriaType] || 0;
        if (currentVal >= badge.criteriaThreshold) {
          try {
            const unlockedRecord = await UserBadge.create({
              userId,
              badgeCode: badge.id,
              unlockedAt: new Date(),
            });

            if (Achievement?.create) {
              await Achievement.create({ userId, badgeId: badge.id }).catch(() => {});
            }

            const notifMsg = `🏆 Nightly Evaluation: You unlocked the ${badge.name} badge!`;
            const notif = await Notification.create({
              user: userId,
              type: 'achievement',
              message: notifMsg,
            }).catch(() => null);

            // Emit real-time socket event if connected
            if (global.io) {
              global.io.to(userId.toString()).emit('achievement:unlocked', {
                badge: badge.toJSON(),
              });
              if (notif) {
                global.io.to(userId.toString()).emit('NOTIF_NEW', notif.toJSON());
              }
            }

            newlyAwardedBadges.push({
              userId,
              badge: badge.toJSON(),
              unlockedAt: unlockedRecord.unlockedAt,
            });
          } catch (err) {
            if (err.name !== 'SequelizeUniqueConstraintError') {
              console.error(`Failed to award badge ${badge.id} to user ${userId}:`, err.message);
            }
          }
        }
      }
    }

    return newlyAwardedBadges;
  } catch (error) {
    console.error('Error during nightly badge evaluation:', error);
    return [];
  }
}

/**
 * Initializes the nightly badge evaluation cron job (runs every midnight 00:00).
 */
function initNightlyBadgeEvaluatorCron() {
  // Schedule cron for 00:00 every night
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron Job] Running nightly user activity & progress badge evaluation...');
    const awarded = await evaluateAllUserBadges();
    console.log(`[Cron Job] Nightly evaluation complete. Awarded ${awarded.length} new badges.`);
  });

  console.log('✓ Nightly progress badge evaluation cron job initialized (00:00 schedule).');
}

module.exports = {
  evaluateAllUserBadges,
  initNightlyBadgeEvaluatorCron,
};

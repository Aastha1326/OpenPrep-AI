const { Achievement, Notification } = require('../models');
const { BADGES, BADGE_LIST } = require('../config/badges');
let logSquadActivity = async () => {};
try {
  const squadActivityService = require('./squadActivityService');
  logSquadActivity = squadActivityService.logSquadActivity;
} catch (e) {
  // Graceful fallback if squadActivityService is missing
}
/**
 * Event Types:
 * - STREAK_UPDATED: { streakDays }
 * - QUIZ_SUBMIT: { score, consecutiveHighScores }
 * - FLASHCARD_CREATED: { totalCreated }
 * - FLASHCARD_REVIEW_SESSION: { sessionReviewedCount }
 * - STUDY_SESSION_LOGGED: { startTime } // expected as Date object
 * - PYQ_ANALYZED: { totalAnalyzed }
 */

async function checkAndAwardBadges(userId, event) {
  if (!userId || !event || !event.type) return [];

  const newlyAwarded = [];
  const candidateBadgeIds = [];

  // Determine candidates based on event type and payload
  switch (event.type) {
    case 'STREAK_UPDATED':
      if (event.payload?.streakDays >= 7) {
        candidateBadgeIds.push(BADGES.WEEK_WARRIOR.id);
      }
      break;

    case 'QUIZ_SUBMIT':
      if (event.payload?.score === 100) {
        candidateBadgeIds.push(BADGES.QUIZ_MASTER.id);
        candidateBadgeIds.push('perfect_score');
      }
      if (event.payload?.consecutiveHighScores >= 3) {
        candidateBadgeIds.push(BADGES.SHARPSHOOTER.id);
      }
      break;

    case 'FLASHCARD_CREATED':
      if (event.payload?.totalCreated >= 50) {
        candidateBadgeIds.push(BADGES.CARD_COLLECTOR.id);
      }
      break;
      
    case 'FLASHCARD_REVIEW_SESSION':
      if (event.payload?.sessionReviewedCount >= 100) {
        candidateBadgeIds.push(BADGES.CENTURY_CLUB.id);
      }
      break;

    case 'STUDY_SESSION_LOGGED':
      if (event.payload?.startTime) {
        const date = new Date(event.payload.startTime);
        const hours = date.getHours();
        if (hours < 7) {
          candidateBadgeIds.push(BADGES.EARLY_BIRD.id);
        }
        if (hours >= 23 || hours < 4) {
          candidateBadgeIds.push(BADGES.NIGHT_OWL.id);
        }
        if (event.payload?.durationHours >= 10) {
          candidateBadgeIds.push(BADGES.STUDY_MARATHON.id);
        }
      }
      break;

    case 'PYQ_ANALYZED':
      if (event.payload?.totalAnalyzed >= 5) {
        candidateBadgeIds.push(BADGES.PYQ_ANALYST.id);
      }
      break;
  }

  if (candidateBadgeIds.length === 0) return [];

  // Check existing achievements
  const existing = await Achievement.findAll({
    where: {
      userId,
      badgeId: candidateBadgeIds
    }
  });

  const existingBadgeIds = existing.map(a => a.badgeId);
  const toAward = candidateBadgeIds.filter(id => !existingBadgeIds.includes(id));

  for (const badgeId of toAward) {
    try {
      const newAch = await Achievement.create({ userId, badgeId });
      const badgeConfig = BADGE_LIST.find(b => b.id === badgeId);
      newlyAwarded.push({ ...newAch.toJSON(), badge: badgeConfig });
      
      // Create an in-app notification for the newly awarded badge
      const notificationMsg = `Congratulations! You unlocked the ${badgeConfig.name} badge: ${badgeConfig.description}.`;
      const notif = await Notification.create({
        user: userId,
        type: 'achievement',
        message: notificationMsg,
      });

// Emit real-time event if socket is available
      if (global.io) {
        global.io.to(userId.toString()).emit('achievement:unlocked', {
          badge: badgeConfig
        });
        
        // Also emit NOTIF_NEW so the bell icon updates in real-time
        global.io.to(userId.toString()).emit('NOTIF_NEW', notif.toJSON());
      }

      // Issue #764: Post a "Badge unlocked" milestone to the user's study squad feeds
      await logSquadActivity(
        userId,
        'badge_unlocked',
        `unlocked the "${badgeConfig.name}" badge 🏆`,
        { badgeId }
      );
    } catch (error) {      if (error.name !== 'SequelizeUniqueConstraintError') {
        console.error('Error awarding badge:', error);
      }
    }
  }

  return newlyAwarded;
}

module.exports = {
  checkAndAwardBadges
};

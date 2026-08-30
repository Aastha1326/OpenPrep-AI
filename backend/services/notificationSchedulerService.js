const cron = require('node-cron');
const { Op } = require('sequelize');
const { User, Flashcard, StudyPlan, NotificationSettings } = require('../models');
const { sendDailyDigestEmail } = require('./emailDigestService');
const { sendTelegramDigest } = require('./telegramBotService');
const { dispatchWebhookNotification } = require('./webhookDispatcherService');

const MOTIVATIONAL_QUOTES = [
  "Consistency is the key to mastering any subject. Keep going!",
  "Your progress is cumulative. Every card reviewed and topic completed counts!",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Focus on progress, not perfection. You are doing great!",
  "The secret of getting ahead is getting started.",
  "Believe you can and you are halfway there."
];

/**
 * Compiles custom briefings and dispatches them through the user's enabled channels.
 */
async function dispatchDailyDigestForUser(user) {
  try {
    // 1. Get or create notification settings for the user
    let [settings] = await NotificationSettings.findOrCreate({
      where: { userId: user.id },
      defaults: {
        dailyDigestEnabled: true,
        dailyDigestTime: '07:00:00',
        channelEmailEnabled: true,
        channelTelegramEnabled: false,
        channelInAppEnabled: true,
      }
    });

    if (!settings.dailyDigestEnabled) {
      return;
    }

    // 2. Fetch overdue flashcards count
    const overdueCount = await Flashcard.count({
      where: {
        user: user.id,
        nextReviewDate: {
          [Op.lte]: new Date(),
        },
      },
    });

    // 3. Fetch today's scheduled topics from active study plans
    const todayStr = new Date().toISOString().split('T')[0];
    const activePlans = await StudyPlan.findAll({
      where: {
        user: user.id,
        status: 'active',
      },
    });

    const scheduledTopics = [];
    for (const plan of activePlans) {
      if (Array.isArray(plan.dailyGoals)) {
        const todayGoal = plan.dailyGoals.find(
          goal => goal.date === todayStr || (goal.date && goal.date.startsWith(todayStr))
        );
        if (todayGoal && todayGoal.topic) {
          scheduledTopics.push(todayGoal.topic);
        }
      }
    }

    // Fallback if no specific topic is scheduled
    if (scheduledTopics.length === 0) {
      scheduledTopics.push("General Revision & Overdue Flashcards");
    }

    // 4. Compile briefing payload
    const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    const briefing = {
      userName: user.name,
      scheduledTopics,
      overdueFlashcardsCount: overdueCount,
      streakCount: user.streakCount || 0,
      quote,
    };

    // 5. Deliver through channels
    if (settings.channelEmailEnabled && user.email) {
      await sendDailyDigestEmail(user.email, briefing);
    }

    if (settings.channelTelegramEnabled && settings.telegramChatId) {
      await sendTelegramDigest(settings.telegramChatId, briefing);
    }

    // Check for general webhook dispatcher URLs in env vars (e.g. for WhatsApp/Discord integration alerts)
    if (process.env.OUTGOING_WEBHOOK_URL) {
      await dispatchWebhookNotification(process.env.OUTGOING_WEBHOOK_URL, briefing);
    }
  } catch (err) {
    console.error(`[NotificationScheduler] Error dispatching digest for user ${user.id}:`, err.message);
  }
}

/**
 * Scans all users and fires briefings.
 */
async function runAllDailyDigests() {
  console.log('⏰ Executing Automated Daily Revision Digests...');
  try {
    const users = await User.findAll();
    for (const user of users) {
      await dispatchDailyDigestForUser(user);
    }
    console.log('✅ Daily Digests completed.');
  } catch (err) {
    console.error('[NotificationScheduler] Main execution loop failed:', err.message);
  }
}

let schedulerJob = null;

/**
 * Initializes the cron daemon running daily at 07:00 AM.
 */
function initNotificationScheduler() {
  // Cron pattern: 0 7 * * * = Daily at 07:00 AM
  schedulerJob = cron.schedule('0 7 * * *', async () => {
    await runAllDailyDigests();
  });
  console.log('⏰ Scheduled Daily Revision Digest Cron (07:00 AM) initialized.');
}

module.exports = {
  initNotificationScheduler,
  runAllDailyDigests,
  dispatchDailyDigestForUser,
};

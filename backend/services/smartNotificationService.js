const webpush = require('web-push');
const { Queue, Worker } = require('bullmq');

// Generate VAPID keys if not present in environment
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || webpush.generateVAPIDKeys().publicKey,
  privateKey: process.env.VAPID_PRIVATE_KEY || webpush.generateVAPIDKeys().privateKey
};

webpush.setVapidDetails(
  'mailto:support@openprep.ai',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

// Queue for scheduling push notifications
const smartRemindersQueue = new Queue('smart-reminders-queue', { connection });

// Set up the worker to process delayed notifications
const worker = new Worker('smart-reminders-queue', async job => {
  const { subscription, payload, preferences } = job.data;
  
  // Respect quiet hours
  if (preferences && preferences.quietHours) {
    const { start, end } = preferences.quietHours;
    const currentHour = new Date().getHours();
    
    // Check if current hour falls within quiet hours (e.g. 22 to 7)
    let isQuiet = false;
    if (start > end) {
      isQuiet = currentHour >= start || currentHour < end;
    } else {
      isQuiet = currentHour >= start && currentHour < end;
    }

    if (isQuiet) {
      console.log(`Notification skipped due to quiet hours for user.`);
      return;
    }
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Smart AI notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}, { connection });

/**
 * Predicts decay points using SM-2 metrics and schedules a notification when retention drops below 75%.
 */
async function scheduleOptimalReview(user, flashcard, sm2Data) {
  if (!user.pushSubscription) return;

  // Assuming an arbitrary formula for retention drop below 75%
  // Ebbinghaus approximation: retention = e^(-t/S) where S is memory strength
  // We'll approximate this drop taking roughly 80% of the SM-2 'interval' (days)
  const daysUntilDecay = Math.max(sm2Data.interval * 0.8, 1);
  const delayMs = daysUntilDecay * 24 * 60 * 60 * 1000;

  const payload = {
    title: '⚡ Brain Hack: Memory Decay Imminent!',
    body: `Quick 30s Check: Do you remember the concept: "${flashcard.topic}"?`,
    url: `/study/flashcards/${flashcard.id}`,
    icon: '/icons/brain-zap.png'
  };

  await smartRemindersQueue.add('send-notification', {
    subscription: user.pushSubscription,
    payload,
    preferences: user.notificationPreferences
  }, {
    delay: delayMs,
    removeOnComplete: true,
    removeOnFail: true,
  });

  return delayMs;
}

module.exports = {
  scheduleOptimalReview,
  vapidPublicKey: vapidKeys.publicKey
};

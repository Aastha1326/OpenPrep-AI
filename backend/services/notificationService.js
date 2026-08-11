const cron = require('node-cron');
const webpush = require('web-push');
const User = require('../models/User');
const { Op } = require('sequelize');

// Set VAPID keys for Web Push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB-5c0J09X9vD_sUj0W0g1zKs';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'x-776O46-t0_Z9bO9P9vWd5z_5XG1L_p9T9P2bF3b8U';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@openprep-ai.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const initNotificationCron = () => {
  // Run every minute to check if any user needs a reminder right now
  cron.schedule('* * * * *', async () => {
    try {
      // Get current time in HH:mm format
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      // Find users whose reminder time matches the current time and who have a push subscription
      const users = await User.findAll({
        where: {
          dailyReminderTime: currentTime,
          pushSubscription: {
            [Op.not]: null
          }
        }
      });

      if (users.length > 0) {
        console.log(`Checking due flashcards for ${users.length} users at ${currentTime}`);
        const Flashcard = require('../models/Flashcard');

        for (const user of users) {
          try {
            const dueCount = await Flashcard.count({
              where: {
                user: user.id,
                nextReviewDate: {
                  [Op.lte]: new Date(),
                },
              },
            });

            if (dueCount > 0) {
              const isHighPriority = dueCount >= 10;
              const payload = JSON.stringify({
                title: isHighPriority ? 'Optimal Spaced Repetition Window 🧠' : 'Daily Flashcards Ready 📚',
                body: isHighPriority
                  ? `You have ${dueCount} flashcards due for revision! Optimize your memory retention by reviewing now.`
                  : `You have ${dueCount} flashcards due for revision today. Keep up the daily practice!`,
                icon: '/icon512_maskable.png',
                badge: '/icon512_rounded.png',
                data: {
                  url: '/flashcards/review'
                }
              });

              await webpush.sendNotification(user.pushSubscription, payload);
              console.log(`Sent push notification to user ${user.id} with ${dueCount} due cards.`);
            }
          } catch (error) {
            console.error(`Failed to send push notification to user ${user.id}:`, error.message);
            // If subscription is invalid/expired (status 410 or 404), we should probably clear it
            if (error.statusCode === 410 || error.statusCode === 404) {
              await User.update({ pushSubscription: null }, { where: { id: user.id } });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in daily reminder cron job:', error);
    }
  });
  
  console.log('Notification cron job initialized');
};

module.exports = {
  initNotificationCron
};

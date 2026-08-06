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
        console.log(`Sending daily reminders to ${users.length} users for time ${currentTime}`);
        
        const payload = JSON.stringify({
          title: 'Daily Study Goal Reminder 📚',
          body: 'It is time for your daily revision session! Log in to keep your streak alive and hit your targets.',
          icon: '/icon512_maskable.png',
          badge: '/icon512_rounded.png',
          data: {
            url: '/'
          }
        });

        for (const user of users) {
          try {
            await webpush.sendNotification(user.pushSubscription, payload);
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

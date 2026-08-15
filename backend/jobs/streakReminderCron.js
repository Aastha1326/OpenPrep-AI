const cron = require('node-cron');
const { Op } = require('sequelize');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

/**
 * Initialize Streak Reminder Cron Job
 * Checks daily at 20:00 (8 PM) to warn users if their streak is at risk
 */
function initStreakReminderCron(io) {
  // Run every day at 20:00
  cron.schedule('0 20 * * *', async () => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      // Find users with an active streak (>0) who haven't studied today
      const usersAtRisk = await User.findAll({
        where: {
          currentStreak: { [Op.gt]: 0 },
          [Op.or]: [
            { lastActivityDate: { [Op.ne]: todayStr } },
            { lastActivityDate: null }
          ]
        }
      });

      for (const user of usersAtRisk) {
        await createNotification(
          user.id,
          '🔥 Streak at Risk!',
          `You haven't studied today. Complete a task to keep your ${user.currentStreak}-day streak alive!`,
          'streak_risk',
          '/dashboard',
          io
        );
      }
    } catch (error) {
      console.warn('Streak reminder cron execution error:', error.message);
    }
  });

  console.log('✅ Streak Reminder Cron Job initialized (runs daily at 20:00)');
}

module.exports = {
  initStreakReminderCron,
};

const cron = require('node-cron');
const { Op } = require('sequelize');
const StudyPlan = require('../models/StudyPlan');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

/**
 * Initialize Study Reminder Cron Job
 * Checks every 15 minutes for study tasks due shortly
 */
function initStudyReminderCron(io) {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();

      // Find active study plans
      const activePlans = await StudyPlan.findAll({
        where: {
          startDate: { [Op.lte]: now },
          endDate: { [Op.gte]: now },
          status: 'active',
        },
      });

      for (const plan of activePlans) {
        if (!plan.dailyGoals || !Array.isArray(plan.dailyGoals)) continue;

        // Load the user to read their dailyReminderTime preference
        const user = await User.findByPk(plan.user);
        if (!user) continue;

        const reminderTime = user.dailyReminderTime || '09:00';
        const [remHour, remMin] = reminderTime.split(':').map(Number);

        // Find today's goals
        const todayStr = now.toISOString().split('T')[0];

        for (const day of plan.dailyGoals) {
          if (!day.date || !day.tasks || !Array.isArray(day.tasks)) continue;

          // Convert day.date to YYYY-MM-DD
          let dayDateStr;
          try {
            dayDateStr = new Date(day.date).toISOString().split('T')[0];
          } catch (e) {
            continue;
          }

          if (dayDateStr !== todayStr) continue;

          let currentMinutes = remHour * 60 + remMin;

          for (const task of day.tasks) {
            const duration = task.duration || 60;

            const taskHour = Math.floor(currentMinutes / 60);
            const taskMinute = currentMinutes % 60;

            const [year, month, dateNum] = day.date.split('-').map(Number);
            const taskTime = new Date(year, month - 1, dateNum, taskHour, taskMinute);

            if (!task.completed) {
              const timeDiffMs = taskTime - now;
              const timeDiffMins = Math.floor(timeDiffMs / 60000);

              // Notify exactly within 15 minutes before the task begins
              if (timeDiffMins >= 0 && timeDiffMins <= 15) {
                await createNotification(
                  plan.user,
                  '⏰ Task Due Soon!',
                  `Your scheduled task "${task.title || 'Study Session'}" starts in 15 minutes.`,
                  'task_due',
                  '/study-planner',
                  io
                );
              }
            }

            currentMinutes += duration;
          }
        }
      }
    } catch (error) {
      console.warn('Study reminder cron execution error:', error.message);
    }
  });

  console.log('✅ Study Reminder Cron Job initialized (runs every 15 mins)');
}

module.exports = {
  initStudyReminderCron,
};

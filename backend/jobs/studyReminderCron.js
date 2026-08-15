const cron = require('node-cron');
const { Op } = require('sequelize');
const StudyPlan = require('../models/StudyPlan');
const { createNotification } = require('../services/notificationService');

/**
 * Initialize Study Reminder Cron Job
 * Checks every 15 minutes for study tasks due shortly
 */
function initStudyReminderCron(io) {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const next15Mins = new Date(now.getTime() + 15 * 60 * 1000);

      // Find active study plans
      const activePlans = await StudyPlan.findAll({
        where: {
          startDate: { [Op.lte]: now },
          endDate: { [Op.gte]: now },
        },
      });

      for (const plan of activePlans) {
        if (!plan.plan || !Array.isArray(plan.plan)) continue;

        for (const item of plan.plan) {
          if (!item.tasks || !Array.isArray(item.tasks)) continue;

          for (const task of item.tasks) {
            // Check if task is scheduled for today and not completed
            if (!task.completed && task.scheduledTime) {
              const taskTime = new Date(task.scheduledTime);
              // Notify 1 hour in advance
              const timeDiffMs = taskTime - now;
              const timeDiffMins = Math.floor(timeDiffMs / 60000);

              if (timeDiffMins > 0 && timeDiffMins <= 60) {
                await createNotification(
                  plan.user,
                  '⏰ Task Due Soon!',
                  `Your scheduled task "${task.title || 'Study Session'}" is due in 1 hour.`,
                  'task_due',
                  '/study-planner',
                  io
                );
              }
            }
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

const cron = require('node-cron');
const { runBackup } = require('../scripts/db-backup');

let cronJob = null;

function initBackupScheduler() {
  const isEnabled =
    process.env.ENABLE_DB_BACKUP_CRON === 'true' || process.env.NODE_ENV === 'production';

  if (!isEnabled) {
    console.log('Automated database backup cron is disabled.');
    return null;
  }

  // Default: Every day at 2:00 AM ('0 2 * * *')
  const schedule = process.env.DB_BACKUP_CRON_SCHEDULE || '0 2 * * *';

  if (!cron.validate(schedule)) {
    console.error(`Invalid cron schedule expression: '${schedule}'`);
    return null;
  }

  console.log(`[BackupScheduler] Scheduling database backup cron: '${schedule}'`);

  cronJob = cron.schedule(schedule, async () => {
    console.log('[BackupScheduler] Running scheduled database backup...');
    try {
      const result = await runBackup();
      console.log(`[BackupScheduler] Scheduled backup created successfully: ${result.fileName}`);
    } catch (err) {
      console.error('[BackupScheduler] Scheduled database backup failed:', err.message);
    }
  });

  return cronJob;
}

function stopBackupScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[BackupScheduler] Backup cron stopped.');
  }
}

module.exports = {
  initBackupScheduler,
  stopBackupScheduler,
};

const fs = require('fs');
const path = require('path');
const {
  runBackup,
  pruneOldBackups,
  obfuscateUrl,
} = require('../../scripts/db-backup');
const { parseFileName } = require('../../scripts/db-restore');
const { initBackupScheduler, stopBackupScheduler } = require('../../services/backupScheduler');

describe('Database Backup & Restore Utilities', () => {
  const testBackupsDir = path.join(__dirname, 'temp_test_backups');

  beforeEach(() => {
    if (!fs.existsSync(testBackupsDir)) {
      fs.mkdirSync(testBackupsDir, { recursive: true });
    }
  });

  afterEach(() => {
    stopBackupScheduler();
    if (fs.existsSync(testBackupsDir)) {
      fs.rmSync(testBackupsDir, { recursive: true, force: true });
    }
  });

  describe('obfuscateUrl', () => {
    it('obfuscates passwords in PostgreSQL connection URLs', () => {
      const plainUrl = 'postgresql://admin:secretPass123@db.example.com:5432/mydb';
      const obfuscated = obfuscateUrl(plainUrl);
      expect(obfuscated).toBe('postgresql://admin:****@db.example.com:5432/mydb');
      expect(obfuscated).not.toContain('secretPass123');
    });

    it('returns original string if no credentials present', () => {
      const noAuthUrl = 'postgresql://localhost:5432/mydb';
      expect(obfuscateUrl(noAuthUrl)).toBe('postgresql://localhost:5432/mydb');
    });
  });

  describe('parseFileName', () => {
    it('parses --file=filename parameter', () => {
      const args = ['--file=backup-2026-08-12.sql.gz'];
      expect(parseFileName(args)).toBe('backup-2026-08-12.sql.gz');
    });

    it('parses --file filename parameter', () => {
      const args = ['--file', 'backup-2026-08-12.sql.gz'];
      expect(parseFileName(args)).toBe('backup-2026-08-12.sql.gz');
    });

    it('parses positional file argument ending with .sql.gz', () => {
      const args = ['backup-2026-08-12.sql.gz'];
      expect(parseFileName(args)).toBe('backup-2026-08-12.sql.gz');
    });

    it('returns null if no file specified', () => {
      const args = ['--verbose'];
      expect(parseFileName(args)).toBeNull();
    });
  });

  describe('pruneOldBackups', () => {
    it('prunes backup files older than specified maxAgeDays', () => {
      const now = Date.now();
      const oldFile = path.join(testBackupsDir, 'backup-old.sql.gz');
      const recentFile = path.join(testBackupsDir, 'backup-recent.sql.gz');

      fs.writeFileSync(oldFile, 'sample dump data');
      fs.writeFileSync(recentFile, 'sample dump data');

      // Modify mtime of old file to 20 days ago
      const twentyDaysAgo = new Date(now - 20 * 24 * 60 * 60 * 1000);
      fs.utimesSync(oldFile, twentyDaysAgo, twentyDaysAgo);

      const pruned = pruneOldBackups(testBackupsDir, 14);

      expect(pruned).toContain('backup-old.sql.gz');
      expect(fs.existsSync(oldFile)).toBe(false);
      expect(fs.existsSync(recentFile)).toBe(true);
    });
  });

  describe('backupScheduler', () => {
    it('does not start scheduler if ENABLE_DB_BACKUP_CRON is false', () => {
      const originalEnv = process.env.ENABLE_DB_BACKUP_CRON;
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.ENABLE_DB_BACKUP_CRON = 'false';
      process.env.NODE_ENV = 'development';

      const job = initBackupScheduler();
      expect(job).toBeNull();

      process.env.ENABLE_DB_BACKUP_CRON = originalEnv;
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('initializes scheduler when ENABLE_DB_BACKUP_CRON is true', () => {
      const originalEnv = process.env.ENABLE_DB_BACKUP_CRON;
      process.env.ENABLE_DB_BACKUP_CRON = 'true';

      const job = initBackupScheduler();
      expect(job).not.toBeNull();

      process.env.ENABLE_DB_BACKUP_CRON = originalEnv;
    });
  });
});

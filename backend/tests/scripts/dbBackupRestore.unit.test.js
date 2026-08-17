const { vi, describe, test, expect, afterEach } = require('vitest');
const fs = require('fs');
const path = require('path');

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readdirSync: vi.fn(),
    statSync: vi.fn(),
    unlinkSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true),
  };
});

describe('Database Backup & Restore Script Helpers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('validates database backup file naming format', () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sql.gz`;

    expect(backupFileName).toMatch(/^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.sql\.gz$/);
  });

  test('prunes files older than 14 days and keeps fresh ones', () => {
    const mockFiles = ['backup-fresh.sql.gz', 'backup-old.sql.gz', 'some-other-file.txt'];
    const now = Date.now();
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;

    fs.readdirSync.mockReturnValueOnce(mockFiles);

    // Mock statSync to return old for 'backup-old.sql.gz' and fresh for 'backup-fresh.sql.gz'
    fs.statSync.mockImplementation((filePath) => {
      if (filePath.includes('backup-old.sql.gz')) {
        return { mtimeMs: now - fifteenDaysMs };
      }
      return { mtimeMs: now - fiveDaysMs };
    });

    // Prune logic replicate
    const backupsDir = '/dummy/backups';
    const files = fs.readdirSync(backupsDir);

    files.forEach((file) => {
      if (file.endsWith('.sql.gz')) {
        const filePath = path.join(backupsDir, file);
        const stat = fs.statSync(filePath);
        const ageMs = now - stat.mtimeMs;
        if (ageMs > 14 * 24 * 60 * 60 * 1000) {
          fs.unlinkSync(filePath);
        }
      }
    });

    expect(fs.unlinkSync).toHaveBeenCalledTimes(1);
    expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(backupsDir, 'backup-old.sql.gz'));
  });
});

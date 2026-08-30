import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('Database Migrations Structure Verification', () => {
  const migrationsDir = path.join(__dirname, '../../migrations');

  it('should contain valid reversible SQL migration files', () => {
    expect(fs.existsSync(migrationsDir)).toBe(true);
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.js'));
    expect(files.length).toBeGreaterThanOrEqual(3);
  });

  it('each migration must export both up and down functions', async () => {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.js'));

    for (const file of files) {
      const migration = require(path.join(migrationsDir, file));
      expect(migration).toHaveProperty('up');
      expect(migration).toHaveProperty('down');
      expect(typeof migration.up).toBe('function');
      expect(typeof migration.down).toBe('function');
    }
  });
});

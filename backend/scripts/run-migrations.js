#!/usr/bin/env node

/**
 * OpenPrep AI Database Migration Runner
 * Usage: node backend/scripts/run-migrations.js [--dry-run] [--rollback] [--status]
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const runner = require('node-pg-migrate').default;
const { pgPool } = require('../config/db');

async function runMigrations() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isRollback = args.includes('--rollback');
  const isStatus = args.includes('--status');

  const direction = isRollback ? 'down' : 'up';
  const count = isRollback ? 1 : Infinity;

  console.log('====================================================');
  console.log(`OpenPrep AI Schema Migration Tool (${direction.toUpperCase()})`);
  console.log(`Dry-run: ${isDryRun ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Migrations Directory: ${path.join(__dirname, '../migrations')}`);
  console.log('====================================================\n');

  try {
    const options = {
      dir: path.join(__dirname, '../migrations'),
      direction,
      count,
      migrationsTable: 'pgmigrations',
      databaseUrl: process.env.DATABASE_URL,
      dryRun: isDryRun,
      verbose: true,
    };

    if (isStatus) {
      console.log('Fetching applied migration status...');
      const res = await pgPool.query('SELECT * FROM pgmigrations ORDER BY id DESC LIMIT 10;');
      console.table(res.rows);
      process.exit(0);
    }

    const appliedMigrations = await runner(options);

    console.log('\nMigration complete.');
    console.log(`Total migrations processed: ${appliedMigrations.length}`);
    appliedMigrations.forEach((m) => {
      console.log(` - ${m.name} (${m.timestamp})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (pgPool) {
      await pgPool.end();
    }
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

const fs = require('fs');
const path = require('path');
require('dotenv').config({
  path: fs.existsSync(path.join(__dirname, '../.env.test'))
    ? path.join(__dirname, '../.env.test')
    : path.join(__dirname, '../.env')
});
const { sequelize } = require('../config/db');
require('../models');

async function run() {
  console.log('Starting DB migration and schema verification test...');
  try {
    // 1. Authenticate connection
    await sequelize.authenticate();
    console.log('Successfully connected to the database.');

    // 2. Initialize schema from Sequelize models
    console.log('Syncing database models to set up base schema...');
    await sequelize.sync({ force: process.argv.includes('--force') });
    console.log('Base schema synchronized successfully.');

    // 3. Find and run migrations in scripts/migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found. Skipping migration scripts.');
      process.exit(0);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration file(s).`);

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute the SQL file.
      const cleanSql = sql
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim();

      if (cleanSql) {
        // Split statements by semicolon to execute individually
        const statements = cleanSql
          .split(';')
          .map((stmt) => stmt.trim())
          .filter((stmt) => stmt.length > 0);

        for (const statement of statements) {
          console.log(`Executing statement:\n${statement}`);
          await sequelize.query(statement);
        }
      }
      console.log(`Successfully completed migration: ${file}`);
    }

    console.log('All migrations executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed with error:', error);
    process.exit(1);
  }
}

run();

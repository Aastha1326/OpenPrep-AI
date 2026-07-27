process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST || 'postgres://postgres:postgres@localhost:5432/openprep_test';

const { sequelize } = require('../models');

beforeAll(async () => {
  // Clear and recreate all tables for clean test execution
  try {
    await sequelize.sync({ force: true });
  } catch (err) {
    console.warn('Test DB sync skipped or failed:', err.message);
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
  } catch (err) {
    // Ignore cleanup error if DB wasn't connected
  }
});

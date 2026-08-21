process.env.NODE_ENV = 'test';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test_jwt_secret_for_tests_must_be_long_enough_32_bytes';
if (!process.env.CSRF_SECRET) process.env.CSRF_SECRET = 'test_csrf_secret_for_tests_must_be_long_enough_32_bytes';
if (!process.env.ENCRYPTION_KEY) process.env.ENCRYPTION_KEY = 'test_encryption_key_for_tests_must_be_long_enough_32_bytes';
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST || 'postgres://postgres:postgres@localhost:5432/openprep_test';

const { sequelize } = require('../models');

const HEALTH_CHECK_TIMEOUT = 4000;

async function isDbAvailable() {
  try {
    await Promise.race([
      sequelize.authenticate(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB health check timed out')), HEALTH_CHECK_TIMEOUT)
      ),
    ]);
    return true;
  } catch {
    console.warn('PostgreSQL is not available — skipping DB sync. Integration tests that require DB will fail with connection errors.');
    return false;
  }
}

beforeAll(async () => {
  const dbAvailable = await isDbAvailable();
  if (dbAvailable) {
    try {
      await sequelize.sync({ force: true });
    } catch (err) {
      console.warn('Test DB sync failed:', err.message);
    }
  }
}, HEALTH_CHECK_TIMEOUT + 5000);

afterAll(async () => {
  try {
    await Promise.race([
      sequelize.close(),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch (err) {
    // Ignore cleanup error if DB wasn't connected
  }
}, 60000);

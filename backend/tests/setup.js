process.env.NODE_ENV = 'test';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test_jwt_secret_for_tests_must_be_long_enough_32_bytes';
if (!process.env.CSRF_SECRET) process.env.CSRF_SECRET = 'test_csrf_secret_for_tests_must_be_long_enough_32_bytes';
if (!process.env.ENCRYPTION_KEY) process.env.ENCRYPTION_KEY = 'test_encryption_key_for_tests_must_be_long_enough_32_bytes';
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST || 'postgres://postgres:postgres@localhost:5432/openprep_test';

/**
 * Load the registry with the failure spelled out.
 *
 * Every backend unit test runs through this file, so one unloadable model
 * takes the whole suite down before a single test is collected. Vitest reports
 * that as "1 failed suite, no tests" with a bare stack — in #1808 it was
 * `TypeError: Cannot read properties of undefined (reading 'define')`, which
 * says nothing about which model, or that the cause was a model importing the
 * sequelize-cli config instead of the instance. The error is still fatal, as
 * it must be; it now arrives naming the file and the likely cause.
 */
function loadModels() {
  try {
    return require('../models');
  } catch (error) {
    const offender = (error.stack || '')
      .split('\n')
      .map((line) => line.match(/(models\/[A-Za-z0-9_.-]+\.js):(\d+)/))
      .find(Boolean);

    console.error(
      [
        '',
        'Failed to load backend/models — no test in this run can start.',
        offender ? `  first model in the stack: ${offender[1]}:${offender[2]}` : null,
        `  ${error.constructor.name}: ${String(error.message).split('\n')[0]}`,
        "  if this reads \"reading 'define'\", the model is importing",
        '  config/database (the sequelize-cli config) rather than the',
        "  instance exported as { sequelize } from config/db.",
        '',
      ]
        .filter(Boolean)
        .join('\n')
    );

    throw error;
  }
}

const { sequelize } = loadModels();

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

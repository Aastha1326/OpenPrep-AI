module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['./tests/helpers/setupDb.js'],
  testTimeout: 30000,
};


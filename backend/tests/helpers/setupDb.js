// Load environment variables for the test environment
const dotenvFlow = require('dotenv-flow');
dotenvFlow.config({
  path: './',
  node_env: 'test'
});

process.env.NODE_ENV = 'test';

const { sequelize } = require('../../models');

beforeAll(async () => {
  try {
    // Authenticate and force sync to reset database schema
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Test DB setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Test DB teardown failed:', error);
  }
});

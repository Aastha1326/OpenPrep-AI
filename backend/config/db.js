const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:NISHIT382424@db.eymuyrdtbinvexvaynxw.supabase.co:5432/postgres';

const sequelize = new Sequelize(
  dbUrl,
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 5,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000
    },
    dialectOptions: {
      ssl: dbUrl.includes('supabase.co') || (process.env.NODE_ENV === 'production' && !dbUrl.includes('localhost'))
        ? { require: true, rejectUnauthorized: false }
        : false,
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT, 10) || 15000,
      idle_in_transaction_session_timeout: parseInt(process.env.DB_IDLE_IN_TRANSACTION_TIMEOUT, 10) || 15000
    },
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/
      ],
      max: 3
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected successfully via Sequelize');

    // Always register models and associations (required for eager loading)
    require('../models');
  } catch (error) {
    console.error(`Error connecting to PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

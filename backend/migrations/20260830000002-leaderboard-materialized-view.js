'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sqlPath = path.join(__dirname, '../scripts/migrations/20260830_leaderboard_materialized_view.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split on semicolon, but handle function definitions (which have inner semicolons)
    // A clean approach is to replace function-specific separators or execute as a transaction/single query block
    // Since PostgreSQL can execute multiple statements in one query call if they are passed as a single block:
    await queryInterface.sequelize.query(sql);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS trg_refresh_leaderboard_users ON "Users";');
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS trg_refresh_leaderboard_quiz ON "QuizAttempts";');
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS refresh_leaderboard_analytics();');
    await queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS leaderboard_analytics;');
  }
};

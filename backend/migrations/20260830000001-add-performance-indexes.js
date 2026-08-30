'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sqlPath = path.join(__dirname, '../scripts/migrations/20260830_add_performance_indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    // Execute statements sequentially if query includes multiple statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      await queryInterface.sequelize.query(statement);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_flashcards_user_due;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_quiz_attempts_user_exam;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_progress_user_subject;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_activity_logs_user_date;');
  }
};

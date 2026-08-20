'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Safely add composite index on QuizAttempts (user, createdAt)
      try {
        await queryInterface.addIndex('QuizAttempts', ['user', 'createdAt'], {
          name: 'idx_quizattempts_user_createdat',
          transaction,
        });
      } catch (e) {
        // Index may already exist from previous migrations
      }

      // Safely add composite index on Flashcards (user, createdAt)
      try {
        await queryInterface.addIndex('Flashcards', ['user', 'createdAt'], {
          name: 'idx_flashcards_user_createdat',
          transaction,
        });
      } catch (e) {}

      // Safely add composite index on Flashcards (user, updatedAt)
      try {
        await queryInterface.addIndex('Flashcards', ['user', 'updatedAt'], {
          name: 'idx_flashcards_user_updatedat',
          transaction,
        });
      } catch (e) {}

      // Safely add composite index on Progress (user, updatedAt)
      try {
        await queryInterface.addIndex('Progress', ['user', 'updatedAt'], {
          name: 'idx_progress_user_updatedat',
          transaction,
        });
      } catch (e) {}

      // Safely add composite index on ActivityLogs (user, createdAt)
      try {
        await queryInterface.addIndex('ActivityLogs', ['user', 'createdAt'], {
          name: 'idx_activitylogs_user_createdat',
          transaction,
        });
      } catch (e) {}

      // Add indexes on AttemptHistory and FlashcardProgress tables if they exist in schema
      try {
        const tables = await queryInterface.showAllTables();
        if (tables.includes('AttemptHistories') || tables.includes('AttemptHistory')) {
          const tableName = tables.includes('AttemptHistories') ? 'AttemptHistories' : 'AttemptHistory';
          await queryInterface.addIndex(tableName, ['userId', 'createdAt'], {
            name: 'idx_attempthistory_userid_createdat',
            transaction,
          });
        }
        if (tables.includes('FlashcardProgresses') || tables.includes('FlashcardProgress')) {
          const tableName = tables.includes('FlashcardProgresses') ? 'FlashcardProgresses' : 'FlashcardProgress';
          await queryInterface.addIndex(tableName, ['userId', 'createdAt'], {
            name: 'idx_flashcardprogress_userid_createdat',
            transaction,
          });
        }
      } catch (e) {}

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      try {
        await queryInterface.removeIndex('QuizAttempts', 'idx_quizattempts_user_createdat', { transaction });
      } catch (e) {}
      try {
        await queryInterface.removeIndex('Flashcards', 'idx_flashcards_user_createdat', { transaction });
      } catch (e) {}
      try {
        await queryInterface.removeIndex('Flashcards', 'idx_flashcards_user_updatedat', { transaction });
      } catch (e) {}
      try {
        await queryInterface.removeIndex('Progress', 'idx_progress_user_updatedat', { transaction });
      } catch (e) {}
      try {
        await queryInterface.removeIndex('ActivityLogs', 'idx_activitylogs_user_createdat', { transaction });
      } catch (e) {}

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};

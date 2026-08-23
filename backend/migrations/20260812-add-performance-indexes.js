'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.getDialect();
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // QuizAttempt: (user, createdAt DESC) - powers /api/quizzes/attempts/history
      await queryInterface.addIndex('QuizAttempts', ['user', { attribute: 'createdAt', order: 'DESC' }], {
        name: 'quizattempts_user_created_desc_idx',
        transaction
      });
      // Flashcard: (deckId, createdAt) - deck-scoped card ordering (no `position` column exists on Flashcard)
      await queryInterface.addIndex('Flashcards', ['deckId', 'createdAt'], {
        name: 'idx_flashcards_deck_created',
        transaction
      });
      // StudyPlanTask: mapped to StudyPlan (user, startDate) 
      await queryInterface.addIndex('StudyPlans', ['user', 'startDate'], {
        name: 'studyplans_user_startdate_idx',
        transaction
      });

      // GIN full-text search on note title/content using PostgreSQL
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS notes_fts_idx ON "Notes" USING GIN (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("content", '')));`,
          { transaction }
        );
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.getDialect();
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.removeIndex('QuizAttempts', 'quizattempts_user_created_desc_idx', { transaction });
      await queryInterface.removeIndex('Flashcards', 'idx_flashcards_deck_created', { transaction });
      await queryInterface.removeIndex('StudyPlans', 'studyplans_user_startdate_idx', { transaction });

      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS notes_fts_idx;`,
          { transaction }
        );
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};

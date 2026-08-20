'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.getDialect();
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // QuizAttempt: (user, createdAt DESC)
      await queryInterface.addIndex('QuizAttempts', ['user', 'createdAt'], {
        name: 'quizattempts_user_created_desc_idx',
        transaction
      });

      // Flashcard: (subject, createdAt) for mapping deck_id and position
      await queryInterface.addIndex('Flashcards', ['subject', 'createdAt'], {
        name: 'flashcards_subject_created_idx',
        transaction
      });

      // StudyPlanTask: mapped to StudyPlan (user, startDate) 
      await queryInterface.addIndex('StudyPlans', ['user', 'startDate'], {
        name: 'studyplans_user_startdate_idx',
        transaction
      });

      // GIN full-text search on flashcard front/back using PostgreSQL
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS flashcards_fts_idx ON "Flashcards" USING GIN (to_tsvector('english', "front" || ' ' || "back"));`,
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
      await queryInterface.removeIndex('Flashcards', 'flashcards_subject_created_idx', { transaction });
      await queryInterface.removeIndex('StudyPlans', 'studyplans_user_startdate_idx', { transaction });

      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS flashcards_fts_idx;`,
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

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('QuizValidationLogs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      questionId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      quizId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Quizzes',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      validationStage: {
        type: Sequelize.ENUM(
          'schema_correctness',
          'answer_key_validation',
          'duplicate_detection',
          'explanation_consistency',
          'source_grounding',
          'difficulty_consistency',
          'distractor_quality',
          'factual_claim_validation'
        ),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('passed', 'failed'),
        allowNull: false
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      retryCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      maxRetries: {
        type: Sequelize.INTEGER,
        defaultValue: 3
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('QuizValidationLogs', ['quizId']);
    await queryInterface.addIndex('QuizValidationLogs', ['validationStage']);
    await queryInterface.addIndex('QuizValidationLogs', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('QuizValidationLogs');
  }
};
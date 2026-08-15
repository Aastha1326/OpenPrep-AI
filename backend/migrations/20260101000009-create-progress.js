'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Progresses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      subject: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Subjects',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      topic: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Topics',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      completionPercentage: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      studyHours: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      quizScores: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      flashcardsMastered: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    await queryInterface.addIndex('Progresses', ['user']);
    await queryInterface.addIndex('Progresses', ['subject']);
    await queryInterface.addIndex('Progresses', ['topic']);
    await queryInterface.addIndex('Progresses', ['user', 'subject']);
    await queryInterface.addIndex('Progresses', ['user', 'updatedAt']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop table with correct Sequelize pluralization (usually Progresses or Progress depending on sync)
    await queryInterface.dropTable('Progresses');
  }
};

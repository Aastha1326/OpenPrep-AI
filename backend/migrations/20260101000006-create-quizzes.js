'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Quizzes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
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
      questions: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      type: {
        type: Sequelize.ENUM('AI_Generated', 'Manual'),
        defaultValue: 'AI_Generated'
      },
      sourceType: {
        type: Sequelize.STRING(20),
        defaultValue: 'AI_Generated',
        allowNull: false
      },
      linkedDeckId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      language: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'english'
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      timeLimit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
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

    await queryInterface.addIndex('Quizzes', ['createdBy', 'id']);
    await queryInterface.addIndex('Quizzes', ['subject']);
    await queryInterface.addIndex('Quizzes', ['topic']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Quizzes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Quizzes_type";');
  }
};

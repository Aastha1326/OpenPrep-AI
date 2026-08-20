'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create DailyGoals table
    await queryInterface.createTable('DailyGoals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      studyPlanId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'StudyPlans',
          key: 'id'
        },
        onDelete: 'CASCADE'
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

    // 2. Create Tasks table
    await queryInterface.createTable('Tasks', {
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
      duration: {
        type: Sequelize.INTEGER,
        defaultValue: 60
      },
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      dailyGoalId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'DailyGoals',
          key: 'id'
        },
        onDelete: 'CASCADE'
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

    // 3. Create Questions table
    await queryInterface.createTable('Questions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      quizId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Quizzes',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      answer: {
        type: Sequelize.TEXT,
        allowNull: false
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

    await queryInterface.addIndex('DailyGoals', ['studyPlanId']);
    await queryInterface.addIndex('Tasks', ['dailyGoalId']);
    await queryInterface.addIndex('Questions', ['quizId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Questions');
    await queryInterface.dropTable('Tasks');
    await queryInterface.dropTable('DailyGoals');
  }
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('StudyPlans', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      exam: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Exams',
          key: 'id'
        },
        onDelete: 'CASCADE'
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
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      dailyGoals: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      milestones: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'archived'),
        defaultValue: 'active'
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

    await queryInterface.addIndex('StudyPlans', ['user']);
    await queryInterface.addIndex('StudyPlans', ['exam']);
    await queryInterface.addIndex('StudyPlans', ['user', 'exam']);
    await queryInterface.addIndex('StudyPlans', ['user', 'exam', 'createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('StudyPlans');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_StudyPlans_status";');
  }
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Topics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
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
      status: {
        type: Sequelize.ENUM('Weak', 'Medium', 'Strong'),
        defaultValue: 'Medium'
      },
      weightage: {
        type: Sequelize.FLOAT,
        defaultValue: 0
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

    await queryInterface.addIndex('Topics', ['subject']);
    await queryInterface.addIndex('Topics', ['user']);
    await queryInterface.addIndex('Topics', ['subject', 'name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Topics');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Topics_status";');
  }
};

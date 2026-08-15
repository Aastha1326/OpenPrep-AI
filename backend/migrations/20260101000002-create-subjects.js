'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Subjects', {
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
      weightage: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      clonedFromId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      cloneCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      rating: {
        type: Sequelize.FLOAT,
        defaultValue: 0.0
      },
      ratingsCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      ratingCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      starCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      tags: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.addIndex('Subjects', ['exam']);
    await queryInterface.addIndex('Subjects', ['user']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Subjects');
  }
};

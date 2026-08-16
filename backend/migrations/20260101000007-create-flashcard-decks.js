'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FlashcardDecks', {
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
      subject: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Subjects',
          key: 'id'
        },
        onDelete: 'SET NULL'
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
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      shareToken: {
        type: Sequelize.UUID,
        allowNull: true
      },
      cloneCount: {
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

    await queryInterface.addIndex('FlashcardDecks', ['user']);
    await queryInterface.addIndex('FlashcardDecks', ['subject']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FlashcardDecks');
  }
};

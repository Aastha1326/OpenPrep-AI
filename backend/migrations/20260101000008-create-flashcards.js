'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Flashcards', {
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
      deckId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'FlashcardDecks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      front: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      back: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      hint: {
        type: Sequelize.TEXT
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      difficulty: {
        type: Sequelize.STRING
      },
      interval: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      repetitions: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      efactor: {
        type: Sequelize.FLOAT,
        defaultValue: 2.5
      },
      nextReviewDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      sourceUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      timestampSeconds: {
        type: Sequelize.INTEGER,
        allowNull: true,
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

    await queryInterface.addIndex('Flashcards', ['user']);
    await queryInterface.addIndex('Flashcards', ['subject']);
    await queryInterface.addIndex('Flashcards', ['topic']);
    await queryInterface.addIndex('Flashcards', ['deckId']);
    await queryInterface.addIndex('Flashcards', ['nextReviewDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Flashcards');
  }
};

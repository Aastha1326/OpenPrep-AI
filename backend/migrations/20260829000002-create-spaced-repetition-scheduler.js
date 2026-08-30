'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Table for scheduler versions (to track algorithm changes)
    await queryInterface.createTable('SchedulerVersions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      versionNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
      },
      algorithmName: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'e.g., "SM-2", "FSRS", "Custom"'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Table for scheduling state per flashcard
    await queryInterface.createTable('FlashcardSchedulingStates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      flashcardId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Flashcards',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      schedulerVersionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'SchedulerVersions',
          key: 'id'
        }
      },
      repetitionCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of successful reviews'
      },
      interval: {
        type: Sequelize.FLOAT,
        defaultValue: 1.0,
        comment: 'Days between reviews'
      },
      easeFactor: {
        type: Sequelize.FLOAT,
        defaultValue: 2.5,
        comment: 'Multiplier for interval calculation'
      },
      nextReviewDate: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this card is next due (UTC)'
      },
      lastReviewedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this card was last reviewed (UTC)'
      },
      timezoneIdentifier: {
        type: Sequelize.STRING,
        defaultValue: 'UTC',
        comment: 'Timezone for date calculations'
      },
      state: {
        type: Sequelize.ENUM('new', 'learning', 'review', 'relearning'),
        defaultValue: 'new'
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

    // Table for review history
    await queryInterface.createTable('FlashcardReviewHistories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      flashcardId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Flashcards',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      schedulerVersionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'SchedulerVersions',
          key: 'id'
        }
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When review occurred (UTC)'
      },
      quality: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: { min: 0, max: 5 },
        comment: 'User rating 0-5 (0=fail, 5=perfect recall)'
      },
      preState: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'State before review'
      },
      postState: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'State after review'
      },
      reviewDurationMs: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Time spent on card review'
      },
      timezoneIdentifier: {
        type: Sequelize.STRING,
        defaultValue: 'UTC'
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

    // Table for duplicate detection
    await queryInterface.createTable('ReviewSubmissionTokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      flashcardId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Flashcards',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      submissionToken: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique token from client to detect duplicates'
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      reviewHistoryId: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Reference to the processed review'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indexes
    await queryInterface.addIndex('FlashcardSchedulingStates', ['flashcardId']);
    await queryInterface.addIndex('FlashcardSchedulingStates', ['nextReviewDate']);
    await queryInterface.addIndex('FlashcardSchedulingStates', ['state']);
    await queryInterface.addIndex('FlashcardReviewHistories', ['flashcardId']);
    await queryInterface.addIndex('FlashcardReviewHistories', ['reviewedAt']);
    await queryInterface.addIndex('ReviewSubmissionTokens', ['flashcardId']);
    await queryInterface.addIndex('ReviewSubmissionTokens', ['submissionToken']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ReviewSubmissionTokens');
    await queryInterface.dropTable('FlashcardReviewHistories');
    await queryInterface.dropTable('FlashcardSchedulingStates');
    await queryInterface.dropTable('SchedulerVersions');
  }
};
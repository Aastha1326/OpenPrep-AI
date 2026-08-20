'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PYQs', {
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
      exam: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Exams',
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
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      difficulty: {
        type: Sequelize.ENUM('Easy', 'Medium', 'Hard'),
        defaultValue: 'Medium'
      },
      chapters: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      fileUrl: {
        type: Sequelize.STRING,
        allowNull: false
      },
      analyzed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      analysisResults: {
        type: Sequelize.JSONB,
        defaultValue: {
          chapterWeightage: [],
          importantTopics: [],
          repeatedQuestions: [],
          trendAnalysis: ''
        }
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
      searchVector: {
        type: Sequelize.TSVECTOR,
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

    await queryInterface.addIndex('PYQs', ['user', 'id']);
    await queryInterface.addIndex('PYQs', ['exam']);
    await queryInterface.addIndex('PYQs', ['subject']);
    await queryInterface.addIndex('PYQs', ['user', 'exam']);
    await queryInterface.addIndex('PYQs', ['subject', 'year', 'difficulty']);
    await queryInterface.addIndex('PYQs', ['exam', 'year', 'subject']);
    await queryInterface.addIndex('PYQs', ['user', 'exam', 'createdAt']);
    await queryInterface.addIndex('PYQs', ['user', 'subject', 'year']);

    // Create GIN index on searchVector
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS pyq_search_vector_idx ON "PYQs" USING GIN (searchVector);');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PYQs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_PYQs_difficulty";');
  }
};

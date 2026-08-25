'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WeaknessReports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      subject: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Subjects', key: 'id' },
        onDelete: 'SET NULL',
      },
      subjectName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      topicBreakdown: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      overallScore: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      weakCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      mediumCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      strongCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      coveragePercentage: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      aiRecommendations: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      trendDirection: {
        type: Sequelize.ENUM('improving', 'stable', 'declining'),
        defaultValue: 'stable',
      },
      comparisonDelta: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      snapshotType: {
        type: Sequelize.ENUM('auto', 'manual', 'post-quiz', 'post-study'),
        defaultValue: 'auto',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('WeaknessReports', ['user'], {
      name: 'weaknessreport_user_idx',
    });
    await queryInterface.addIndex('WeaknessReports', ['user', 'subject'], {
      name: 'weaknessreport_user_subject_idx',
    });
    await queryInterface.addIndex('WeaknessReports', ['user', 'createdAt'], {
      name: 'weaknessreport_user_created_idx',
    });
    await queryInterface.addIndex('WeaknessReports', ['user', 'trendDirection'], {
      name: 'weaknessreport_user_trend_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('WeaknessReports');
  },
};

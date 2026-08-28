'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interview_processing_jobs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      interviewId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'mock_interviews',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'QUEUED',
      },
      currentStage: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'PROCESSING',
      },
      attempts: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      intermediateResults: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      lastError: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lockedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex(
      'interview_processing_jobs',
      ['status'],
      {
        name: 'idx_interview_processing_jobs_status',
      }
    );

    await queryInterface.addIndex(
      'interview_processing_jobs',
      ['lockedAt'],
      {
        name: 'idx_interview_processing_jobs_locked_at',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'interview_processing_jobs',
      'idx_interview_processing_jobs_status'
    );

    await queryInterface.removeIndex(
      'interview_processing_jobs',
      'idx_interview_processing_jobs_locked_at'
    );

    await queryInterface.dropTable('interview_processing_jobs');
  },
};
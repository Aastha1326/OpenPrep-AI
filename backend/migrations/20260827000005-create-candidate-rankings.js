'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('candidate_rankings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      interviewId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'mock_interviews',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      partitionType: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      partitionKey: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      score: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      percentile: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      benchmark: {
        type: Sequelize.FLOAT,
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

    await queryInterface.addConstraint('candidate_rankings', {
      fields: ['userId', 'partitionType', 'partitionKey'],
      type: 'unique',
      name: 'candidate_rankings_user_partition_unique',
    });

    await queryInterface.addIndex(
      'candidate_rankings',
      ['partitionType', 'partitionKey', 'score'],
      {
        name: 'candidate_rankings_partition_score_idx',
      }
    );

    await queryInterface.addIndex(
      'candidate_rankings',
      ['interviewId'],
      {
        name: 'candidate_rankings_interview_idx',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'candidate_rankings',
      'candidate_rankings_partition_score_idx'
    );

    await queryInterface.removeIndex(
      'candidate_rankings',
      'candidate_rankings_interview_idx'
    );

    await queryInterface.removeConstraint(
      'candidate_rankings',
      'candidate_rankings_user_partition_unique'
    );

    await queryInterface.dropTable('candidate_rankings');
  },
};
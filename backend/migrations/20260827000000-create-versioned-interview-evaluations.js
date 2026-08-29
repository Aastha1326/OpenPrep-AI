'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('evaluation_versions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      version: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      weights: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      rubric: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      rules: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addColumn('mock_interviews', 'evaluationVersionId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'evaluation_versions',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addColumn('mock_interviews', 'evaluationSnapshot', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Immutable evaluation schema and scoring configuration used for this interview',
    });

    await queryInterface.addIndex(
      'mock_interviews',
      ['evaluationVersionId'],
      { name: 'idx_mock_interviews_evaluation_version' }
    );

    await queryInterface.bulkInsert('evaluation_versions', [
      {
        id: Sequelize.literal('gen_random_uuid()'),
        version: '1.0',
        description: 'Initial deterministic interview evaluation engine',
        weights: JSON.stringify({
          technical: 0.5,
          communication: 0.3,
          confidence: 0.2,
        }),
        rubric: JSON.stringify({
          technical: {
            baseScore: 50,
            responseCountBonus: 5,
            averageWordsBonus: 0.2,
          },
          communication: {
            baseScore: 40,
            averageWordsBonus: 0.5,
          },
          confidence: {
            fallbackScore: 50,
          },
        }),
        rules: JSON.stringify({
          minScore: 0,
          maxScore: 100,
          feedback:
            'Focus on clear explanations, structured answers, and confident communication.',
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.sequelize.query(`
      UPDATE mock_interviews
      SET "evaluationVersionId" = (
        SELECT id
        FROM evaluation_versions
        WHERE version = '1.0'
        LIMIT 1
      )
      WHERE "evaluationVersionId" IS NULL
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex(
      'mock_interviews',
      'idx_mock_interviews_evaluation_version'
    );

    await queryInterface.removeColumn(
      'mock_interviews',
      'evaluationSnapshot'
    );

    await queryInterface.removeColumn(
      'mock_interviews',
      'evaluationVersionId'
    );

    await queryInterface.dropTable('evaluation_versions');
  },
};
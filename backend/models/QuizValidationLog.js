const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const QuizValidationLog = sequelize.define(
  'QuizValidationLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    validationStage: {
      type: DataTypes.ENUM(
        'schema_correctness',
        'answer_key_validation',
        'duplicate_detection',
        'explanation_consistency',
        'source_grounding',
        'difficulty_consistency',
        'distractor_quality',
        'factual_claim_validation'
      ),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('passed', 'failed'),
      allowNull: false,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
    },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'qvl_quiz_idx', fields: ['quizId'] },
      { name: 'qvl_stage_idx', fields: ['validationStage'] },
      { name: 'qvl_status_idx', fields: ['status'] },
    ],
  }
);

module.exports = QuizValidationLog;
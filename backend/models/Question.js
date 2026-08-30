const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const searchIndex = require('../services/searchIndexService');

const Question = sequelize.define(
  'Question',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    noteId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    type: {
      type: DataTypes.ENUM('multiple_choice', 'short_answer', 'essay', 'true_false'),
      defaultValue: 'multiple_choice',
    },
    difficulty: {
      type: DataTypes.STRING,
      defaultValue: 'medium',
    },
    sourceTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // IRT 3PL Calibration Parameters
    // Item Response Theory parameter 'a' (discrimination)
    // Higher values = more discriminative between ability levels
    // Typical range: 0.5 - 2.5, default 1.2
    irtDiscrimination: {
      type: DataTypes.FLOAT,
      defaultValue: 1.2,
      validate: {
        min: 0.1,
        max: 3.0,
      },
      comment: 'IRT parameter a: Item discrimination (0.1-3.0)',
    },
    // Item Response Theory parameter 'b' (difficulty)
    // Ability level at which P(correct) = (1+c)/2
    // Range: -3.0 (very easy) to +3.0 (very hard), default 0.0 (medium)
    irtDifficulty: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
      validate: {
        min: -3.0,
        max: 3.0,
      },
      comment: 'IRT parameter b: Item difficulty (-3.0 to +3.0)',
    },
    // Item Response Theory parameter 'c' (guessing/lower asymptote)
    // Probability of correct answer by random guessing
    // Range: 0.0 to 1.0, typical 0.20-0.25 for 4-option MCQ
    irtGuessing: {
      type: DataTypes.FLOAT,
      defaultValue: 0.25,
      validate: {
        min: 0.0,
        max: 1.0,
      },
      comment: 'IRT parameter c: Guessing parameter (lower asymptote)',
    },
    // Number of responses used to calibrate this item
    irtCalibrationCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of student responses used for IRT calibration',
    },
    // Standard error of IRT parameter estimates
    irtParameterSE: {
      type: DataTypes.JSONB,
      defaultValue: { a: null, b: null, c: null },
      comment: 'Standard errors of a, b, c parameters',
    },
    // Timestamp of last IRT calibration
    irtLastCalibrated: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of last IRT calibration update',
    },
  },
  {
    timestamps: true,
    tableName: 'questions',
  }
);

Question.afterSave((question) => searchIndex.enqueueIndex('question', question));
Question.afterDestroy((question) => searchIndex.removeRecord('question', question));

module.exports = Question;

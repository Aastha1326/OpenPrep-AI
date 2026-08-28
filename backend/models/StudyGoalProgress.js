const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * StudyGoalProgress — individual progress entries linked to a StudyGoal.
 *
 * Each row represents a single increment toward the goal (e.g. 0.5 hours
 * studied, 1 quiz completed). The service layer aggregates these into the
 * goal's currentValue and determines streak / completion status.
 */
const StudyGoalProgress = sequelize.define(
  'StudyGoalProgress',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    goalId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Progress value cannot be negative' },
      },
    },
    source: {
      type: DataTypes.ENUM(
        'quiz_attempt',
        'flashcard_review',
        'focus_session',
        'note_creation',
        'manual',
        'api'
      ),
      defaultValue: 'manual',
    },
    sourceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recordedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: 'studygoalprogress_goal_idx',
        fields: ['goalId'],
      },
      {
        name: 'studygoalprogress_user_recorded_idx',
        fields: ['user', 'recordedAt'],
      },
    ],
  }
);

module.exports = StudyGoalProgress;

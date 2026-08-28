const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * StudyGoal — tracks daily and weekly study targets set by students.
 *
 * Each goal captures a measurable target (e.g. "study 3 hours",
 * "complete 2 quizzes", "review 50 flashcards") along with its
 * current progress, making it easy to surface streak and completion
 * analytics on the frontend dashboard.
 */
const StudyGoal = sequelize.define(
  'StudyGoal',
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
    subject: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Goal title is required' },
        len: { args: [1, 200], msg: 'Goal title must be between 1 and 200 characters' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    goalType: {
      type: DataTypes.ENUM('daily', 'weekly', 'custom'),
      defaultValue: 'daily',
      allowNull: false,
    },
    metricType: {
      type: DataTypes.ENUM(
        'study_hours',
        'quizzes_completed',
        'flashcards_reviewed',
        'notes_created',
        'topics_covered',
        'custom'
      ),
      defaultValue: 'study_hours',
      allowNull: false,
    },
    targetValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: { args: [0.1], msg: 'Target value must be greater than 0' },
      },
    },
    currentValue: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Current value cannot be negative' },
      },
    },
    unit: {
      type: DataTypes.STRING,
      defaultValue: 'hours',
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'paused', 'expired', 'missed'),
      defaultValue: 'active',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    streakDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    bestStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    reminderTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: 'studygoal_user_status_idx',
        fields: ['user', 'status'],
      },
      {
        name: 'studygoal_user_dates_idx',
        fields: ['user', 'startDate', 'endDate'],
      },
      {
        name: 'studygoal_user_type_idx',
        fields: ['user', 'goalType'],
      },
      {
        name: 'studygoal_subject_idx',
        fields: ['subject'],
      },
    ],
  }
);

module.exports = StudyGoal;

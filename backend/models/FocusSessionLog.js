const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * FocusSessionLog — Detailed log for each focus/pomodoro session.
 *
 * Tracks granular session data including subject, task type, planned and
 * actual durations, interruption events, break history, and computed
 * efficiency scores. Powers the Focus Session Analytics dashboard.
 */
const FocusSessionLog = sequelize.define(
  'FocusSessionLog',
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
    subjectName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    taskType: {
      type: DataTypes.ENUM(
        'reading',
        'flashcards',
        'quiz',
        'notes',
        'revision',
        'practice',
        'other'
      ),
      defaultValue: 'other',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    plannedMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 25,
      validate: { min: 1, max: 360 },
    },
    actualMinutes: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    activeSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    pausedSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    breakSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    interruptions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    interruptionDetails: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    efficiencyScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    focusScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    status: {
      type: DataTypes.ENUM('active', 'paused', 'completed', 'abandoned'),
      defaultValue: 'active',
    },
    pomodoroNumber: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    dailyGoalMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 120,
    },
    metGoal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
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
      { name: 'fslog_user_status_idx', fields: ['user', 'status'] },
      { name: 'fslog_user_created_idx', fields: ['user', 'createdAt'] },
      { name: 'fslog_user_subject_idx', fields: ['user', 'subject'] },
      { name: 'fslog_user_tasktype_idx', fields: ['user', 'taskType'] },
      { name: 'fslog_user_date_idx', fields: ['user', 'startedAt'] },
    ],
  }
);

module.exports = FocusSessionLog;

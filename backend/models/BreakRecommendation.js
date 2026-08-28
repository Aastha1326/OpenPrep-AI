const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * BreakRecommendation — stores computed break schedules, effectiveness
 * tracking, and cognitive load snapshots for a user's study sessions.
 */
const BreakRecommendation = sequelize.define(
  'BreakRecommendation',
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
    // ── Recommendation Configuration ──
    pomodoroLength: {
      type: DataTypes.INTEGER,
      defaultValue: 25,
      validate: { min: 5, max: 120 },
    },
    shortBreakMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: { min: 1, max: 30 },
    },
    longBreakMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
      validate: { min: 5, max: 60 },
    },
    longBreakInterval: {
      type: DataTypes.INTEGER,
      defaultValue: 4,
      validate: { min: 2, max: 10 },
    },
    // ── Cognitive Load Tracking ──
    cognitiveLoadScore: {
      type: DataTypes.FLOAT,
      defaultValue: 50,
      validate: { min: 0, max: 100 },
    },
    fatigueIndex: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    recoveryRate: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0,
    },
    // ── Session Context ──
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    taskType: {
      type: DataTypes.ENUM('reading', 'flashcards', 'quiz', 'notes', 'revision', 'practice', 'other'),
      defaultValue: 'other',
    },
    // ── Effectiveness Metrics ──
    suggestedIntervalMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 25,
    },
    actualBreakTaken: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    breakCompliance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    postBreakFocusGain: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    // ── Personalization Profile ──
    optimalPomodoro: {
      type: DataTypes.INTEGER,
      defaultValue: 25,
    },
    optimalBreak: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
    learningStyle: {
      type: DataTypes.ENUM('sprint', 'marathon', 'mixed'),
      defaultValue: 'mixed',
    },
    peakPerformanceHour: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      validate: { min: 0, max: 23 },
    },
    // ── Session State ──
    status: {
      type: DataTypes.ENUM('active', 'completed', 'expired'),
      defaultValue: 'active',
    },
    completedPomodoros: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalBreakMinutes: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'breakrec_user_idx', fields: ['user'] },
      { name: 'breakrec_user_status_idx', fields: ['user', 'status'] },
      { name: 'breakrec_user_created_idx', fields: ['user', 'createdAt'] },
    ],
  }
);

module.exports = BreakRecommendation;

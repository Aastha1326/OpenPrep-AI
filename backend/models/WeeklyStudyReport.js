const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * WeeklyStudyReport — auto-generated weekly study analytics snapshots.
 *
 * Created by the background scheduler every Sunday at midnight (or on
 * demand via the controller). Captures aggregated metrics across all
 * goals, quizzes, flashcards and focus sessions for the reporting week.
 */
const WeeklyStudyReport = sequelize.define(
  'WeeklyStudyReport',
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
    weekStart: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    weekEnd: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    totalStudyMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    goalsSet: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    goalsCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    goalCompletionRate: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    quizzesTaken: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    averageQuizScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    flashcardsReviewed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    focusSessions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    subjectBreakdown: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    dailyBreakdown: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    strengths: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    improvements: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    streakDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    aiInsight: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: 'weeklyreport_user_week_idx',
        unique: true,
        fields: ['user', 'weekStart', 'weekEnd'],
      },
    ],
  }
);

module.exports = WeeklyStudyReport;

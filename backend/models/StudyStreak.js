const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * StudyStreak — records daily study activity and streak analytics.
 * Each row represents one day's study summary, enabling streak
 * computation, calendar heatmap rendering, and consistency analysis.
 */
const StudyStreak = sequelize.define(
  'StudyStreak',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user: { type: DataTypes.UUID, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    active: { type: DataTypes.BOOLEAN, defaultValue: false },
    studyMinutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    quizzesTaken: { type: DataTypes.INTEGER, defaultValue: 0 },
    topicsReviewed: { type: DataTypes.INTEGER, defaultValue: 0 },
    flashcardsReviewed: { type: DataTypes.INTEGER, defaultValue: 0 },
    xpEarned: { type: DataTypes.INTEGER, defaultValue: 0 },
    streakDay: { type: DataTypes.INTEGER, defaultValue: 0 },
    sessionCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'studystreak_user_idx', fields: ['user'] },
      { name: 'studystreak_user_date_idx', fields: ['user', 'date'], unique: true },
      { name: 'studystreak_user_active_idx', fields: ['user', 'active'] },
    ],
  }
);

module.exports = StudyStreak;

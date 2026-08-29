const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * RevisionSchedule — an AI-generated, adaptive revision plan that maps
 * topics to optimal revision dates based on readiness scores, weakness
 * signals, and spaced repetition intervals.
 *
 * Each schedule belongs to a user and spans from today until the exam
 * date. The scheduler recalculates slot priorities whenever new quiz
 * or flashcard data arrives.
 */
const RevisionSchedule = sequelize.define(
  'RevisionSchedule',
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Exam Revision Plan',
    },
    examDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dailyStudyHours: {
      type: DataTypes.FLOAT,
      defaultValue: 3,
      validate: { min: 0.5, max: 16 },
    },
    status: {
      type: DataTypes.ENUM('active', 'paused', 'completed', 'expired'),
      defaultValue: 'active',
    },
    totalSlots: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    completedSlots: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    overallProgress: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    averageReadinessAtStart: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    currentReadiness: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    subjectWeights: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'revisionschedule_user_status_idx', fields: ['user', 'status'] },
      { name: 'revisionschedule_user_exam_idx', fields: ['user', 'examDate'] },
    ],
  }
);

module.exports = RevisionSchedule;

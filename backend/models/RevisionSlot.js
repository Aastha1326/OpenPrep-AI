const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * RevisionSlot — a single revision session within a RevisionSchedule.
 *
 * Each slot maps a subject/topic to a specific date and time window,
 * with a priority score derived from the subject's readiness level,
 * weakness signals, and spaced repetition interval.
 */
const RevisionSlot = sequelize.define(
  'RevisionSlot',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    scheduleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    subject: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    topic: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 45,
      validate: { min: 10, max: 240 },
    },
    activityType: {
      type: DataTypes.ENUM(
        'review_flashcards',
        'practice_quiz',
        'read_notes',
        'solve_pyq',
        'deep_dive',
        'light_review',
        'mixed'
      ),
      defaultValue: 'mixed',
    },
    priority: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
      defaultValue: 'medium',
    },
    priorityScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.5,
      validate: { min: 0, max: 1 },
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'skipped', 'rescheduled'),
      defaultValue: 'pending',
    },
    readinessAtCreation: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    readinessAfter: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    spacedRepetitionInterval: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    revisionNumber: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
      { name: 'revisionslot_schedule_idx', fields: ['scheduleId'] },
      { name: 'revisionslot_user_date_idx', fields: ['user', 'scheduledDate'] },
      { name: 'revisionslot_user_status_idx', fields: ['user', 'status'] },
      { name: 'revisionslot_subject_idx', fields: ['subject'] },
    ],
  }
);

module.exports = RevisionSlot;

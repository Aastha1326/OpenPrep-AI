const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * StudyReminder — configurable smart study reminders with AI-optimized timing.
 * Students set reminders for subjects/topics, choose frequency and time,
 * and the system suggests optimal scheduling based on study patterns.
 */
const StudyReminder = sequelize.define(
  'StudyReminder',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, defaultValue: '' },
    reminderType: {
      type: DataTypes.ENUM('daily', 'weekly', 'before_exam', 'spaced_review', 'custom'),
      defaultValue: 'daily',
    },
    subjectContext: { type: DataTypes.STRING, allowNull: true },
    topicContext: { type: DataTypes.STRING, allowNull: true },
    scheduledTime: { type: DataTypes.TIME, allowNull: false },
    scheduledDays: { type: DataTypes.JSONB, defaultValue: [] },
    nextTriggerAt: { type: DataTypes.DATE, allowNull: true },
    lastTriggeredAt: { type: DataTypes.DATE, allowNull: true },
    triggerCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    priority: { type: DataTypes.ENUM('high', 'medium', 'low'), defaultValue: 'medium' },
    channel: { type: DataTypes.ENUM('in_app', 'email', 'push'), defaultValue: 'in_app' },
    aiSuggested: { type: DataTypes.BOOLEAN, defaultValue: false },
    meta: { type: DataTypes.JSONB, defaultValue: {} },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'studyreminder_user_idx', fields: ['user'] },
      { name: 'studyreminder_user_enabled_idx', fields: ['user', 'enabled'] },
      { name: 'studyreminder_user_nexttrigger_idx', fields: ['user', 'nextTriggerAt'] },
    ],
  }
);

module.exports = StudyReminder;

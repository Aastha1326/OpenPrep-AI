const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * StudyTip — stores AI-generated personalized study tips and daily insights.
 * Each row captures a tip derived from the student's quiz performance,
 * study patterns, weak areas, and current learning context.
 */
const StudyTip = sequelize.define(
  'StudyTip',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user: { type: DataTypes.UUID, allowNull: false },
    tipType: {
      type: DataTypes.ENUM('technique', 'motivation', 'weakness', 'schedule', 'revision', 'general'),
      defaultValue: 'general',
    },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    subjectContext: { type: DataTypes.STRING, allowNull: true },
    topicContext: { type: DataTypes.STRING, allowNull: true },
    priority: { type: DataTypes.ENUM('high', 'medium', 'low'), defaultValue: 'medium' },
    sourceData: { type: DataTypes.JSONB, defaultValue: {} },
    viewed: { type: DataTypes.BOOLEAN, defaultValue: false },
    viewedAt: { type: DataTypes.DATE, allowNull: true },
    helpful: { type: DataTypes.BOOLEAN, allowNull: true },
    dismissed: { type: DataTypes.BOOLEAN, defaultValue: false },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'studytip_user_idx', fields: ['user'] },
      { name: 'studytip_user_type_idx', fields: ['user', 'tipType'] },
      { name: 'studytip_user_created_idx', fields: ['user', 'createdAt'] },
      { name: 'studytip_user_viewed_idx', fields: ['user', 'viewed'] },
    ],
  }
);

module.exports = StudyTip;

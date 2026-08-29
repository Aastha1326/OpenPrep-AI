const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * ExamStrategy — stores AI-generated, personalized exam-day strategies
 * including prioritised action plans, daily breakdowns, battle cards,
 * and readiness predictions.
 */
const ExamStrategy = sequelize.define(
  'ExamStrategy',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user: { type: DataTypes.UUID, allowNull: false },
    exam: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Exam Strategy' },
    status: { type: DataTypes.ENUM('active', 'archived', 'superseded'), defaultValue: 'active' },
    inputSnapshot: { type: DataTypes.JSONB, defaultValue: {} },
    priorityActions: { type: DataTypes.JSONB, defaultValue: [] },
    dailyBreakdown: { type: DataTypes.JSONB, defaultValue: [] },
    battleCard: { type: DataTypes.JSONB, defaultValue: {} },
    readinessPrediction: { type: DataTypes.JSONB, defaultValue: {} },
    aiInsights: { type: DataTypes.JSONB, defaultValue: [] },
    timeAllocation: { type: DataTypes.JSONB, defaultValue: {} },
    viewed: { type: DataTypes.BOOLEAN, defaultValue: false },
    viewedAt: { type: DataTypes.DATE, allowNull: true },
    actionsCompleted: { type: DataTypes.INTEGER, defaultValue: 0 },
    actionsTotal: { type: DataTypes.INTEGER, defaultValue: 0 },
    feedbackRating: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
    feedbackComment: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'examstrategy_user_idx', fields: ['user'] },
      { name: 'examstrategy_exam_idx', fields: ['exam'] },
      { name: 'examstrategy_user_exam_idx', fields: ['user', 'exam'] },
      { name: 'examstrategy_user_status_idx', fields: ['user', 'status'] },
      { name: 'examstrategy_user_created_idx', fields: ['user', 'createdAt'] },
    ],
  }
);

module.exports = ExamStrategy;

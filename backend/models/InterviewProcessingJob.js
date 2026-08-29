const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class InterviewProcessingJob extends Model {}

InterviewProcessingJob.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    interviewId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'QUEUED',
    },
    currentStage: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'PROCESSING',
    },
    attempts: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    intermediateResults: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    lastError: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'InterviewProcessingJob',
    tableName: 'interview_processing_jobs',
    timestamps: true,
  }
);

module.exports = InterviewProcessingJob;
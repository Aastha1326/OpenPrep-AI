const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ExamIntegrityReport = sequelize.define(
  'ExamIntegrityReport',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quizAttemptId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    telemetryLogs: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    biometrics: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    trustScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    anomalyFlags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    timestamps: true,
    tableName: 'ExamIntegrityReports',
  }
);

module.exports = ExamIntegrityReport;

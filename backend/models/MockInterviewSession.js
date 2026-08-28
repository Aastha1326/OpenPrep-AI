const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MockInterviewSession = sequelize.define(
  'MockInterviewSession',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    roomId: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    transcription: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    timestamps: true,
    tableName: 'MockInterviewSessions',
  }
);

module.exports = MockInterviewSession;

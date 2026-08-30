const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SecurityAuditLog = sequelize.define(
  'SecurityAuditLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    eventType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'INFO', // INFO, WARNING, CRITICAL
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    payloadHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    statusCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    tableName: 'SecurityAuditLogs',
    indexes: [
      { fields: ['userId'] },
      { fields: ['eventType'] },
      { fields: ['timestamp'] },
      { fields: ['severity'] },
    ],
  }
);

module.exports = SecurityAuditLog;

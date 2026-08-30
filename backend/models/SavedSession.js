const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SavedSession = sequelize.define(
  'SavedSession',
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
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    restored: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    tableName: 'Sessions',
    indexes: [
      {
        name: 'idx_sessions_user_id',
        fields: ['userId'],
      },
      {
        name: 'idx_sessions_user_restored',
        fields: ['userId', 'restored'],
      },
      {
        name: 'idx_sessions_expires_at',
        fields: ['expiresAt'],
      },
    ],
  }
);

module.exports = SavedSession;

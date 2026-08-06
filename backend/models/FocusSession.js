const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FocusSession = sequelize.define(
  'FocusSession',
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
    subject: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    activeSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    pausedSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    interruptions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    focusScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'focussession_user_idx', fields: ['user'] },
      { name: 'focussession_user_created_idx', fields: ['user', 'createdAt'] },
    ],
  }
);

module.exports = FocusSession;
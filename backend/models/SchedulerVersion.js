const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SchedulerVersion = sequelize.define(
  'SchedulerVersion',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    algorithmName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'sv_version_idx', fields: ['versionNumber'] },
      { name: 'sv_active_idx', fields: ['isActive'] },
    ],
  }
);

module.exports = SchedulerVersion;
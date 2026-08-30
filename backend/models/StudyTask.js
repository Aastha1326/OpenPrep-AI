const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudyTask = sequelize.define(
  'StudyTask',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    versionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estimatedHours: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    completionStatus: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'skipped'),
      defaultValue: 'pending',
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'st_version_idx', fields: ['versionId'] },
      { name: 'st_date_idx', fields: ['scheduledDate'] },
      { name: 'st_status_idx', fields: ['completionStatus'] },
    ],
  }
);

module.exports = StudyTask;
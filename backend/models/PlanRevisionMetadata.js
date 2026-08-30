const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PlanRevisionMetadata = sequelize.define(
  'PlanRevisionMetadata',
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
    revisionReason: {
      type: DataTypes.ENUM(
        'initial_creation',
        'exam_date_changed',
        'available_hours_changed',
        'performance_change',
        'manual_adjustment'
      ),
      allowNull: false,
    },
    previousExamDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    newExamDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    previousDailyHours: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    newDailyHours: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    changedTaskCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    preservedTaskCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    indexes: [{ name: 'prm_version_idx', fields: ['versionId'] }],
  }
);

module.exports = PlanRevisionMetadata;
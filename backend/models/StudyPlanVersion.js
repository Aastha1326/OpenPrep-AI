const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudyPlanVersion = sequelize.define(
  'StudyPlanVersion',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studyPlanId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'spv_studyplan_idx', fields: ['studyPlanId'] },
      { name: 'spv_active_idx', fields: ['isActive'] },
      { name: 'spv_version_idx', fields: ['studyPlanId', 'versionNumber'] },
    ],
  }
);

module.exports = StudyPlanVersion;
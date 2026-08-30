const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SkillDependency = sequelize.define(
  'SkillDependency',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    skillId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    prerequisiteSkillId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    dependencyType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'prerequisite',
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: 'skill_dependencies',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['skillId', 'prerequisiteSkillId'],
      },
      {
        fields: ['skillId'],
      },
      {
        fields: ['prerequisiteSkillId'],
      },
    ],
  }
);

module.exports = SkillDependency;
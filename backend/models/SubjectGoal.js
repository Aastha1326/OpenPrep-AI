const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SubjectGoal = sequelize.define(
  'SubjectGoal',
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
      allowNull: false,
    },
    targetPercentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: 'subjectgoal_user_idx',
        fields: ['user'],
      },
      {
        name: 'subjectgoal_subject_idx',
        fields: ['subject'],
      },
      {
        name: 'subjectgoal_user_subject_unique',
        unique: true,
        fields: ['user', 'subject'],
      },
    ],
  }
);

module.exports = SubjectGoal;
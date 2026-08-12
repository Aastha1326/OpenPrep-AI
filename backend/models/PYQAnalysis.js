const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PYQAnalysis = sequelize.define(
  'PYQAnalysis',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    examName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    yearRange: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    weightageData: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['subjectId'],
      },
      {
        fields: ['userId'],
      },
    ],
  }
);

module.exports = PYQAnalysis;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ReadinessSnapshot = sequelize.define(
  'ReadinessSnapshot',
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
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    readinessScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    syllabusCoverage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    quizAccuracy: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    memoryRetention: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    studyVelocity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    aiRecommendation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['subjectId'],
      },
      {
        fields: ['userId', 'subjectId'],
      },
    ],
  }
);

module.exports = ReadinessSnapshot;

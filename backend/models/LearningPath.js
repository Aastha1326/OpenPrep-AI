const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LearningPath = sequelize.define(
  'LearningPath',
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
    goal: {
      type: DataTypes.STRING,
      defaultValue: 'General Mastery & Exam Prep',
    },
    pathItems: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    overallProgress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'archived'),
      defaultValue: 'active',
    },
  },
  {
    timestamps: true,
    tableName: 'learning_paths',
  }
);

module.exports = LearningPath;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserProgress = sequelize.define(
  'UserProgress',
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
    quiz: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    maxScore: {
      type: DataTypes.FLOAT,
      defaultValue: 100,
    },
    percentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium',
    },
    timeSpentSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    performanceVector: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    attemptedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    tableName: 'user_progress',
    indexes: [
      {
        name: 'user_progress_user_idx',
        fields: ['user'],
      },
      {
        name: 'user_progress_topic_idx',
        fields: ['topic'],
      },
      {
        name: 'user_progress_user_topic_idx',
        fields: ['user', 'topic'],
      },
      {
        name: 'user_progress_attempted_idx',
        fields: ['attemptedAt'],
      },
    ],
  }
);

module.exports = UserProgress;

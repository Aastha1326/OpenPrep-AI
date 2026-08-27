const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Question = sequelize.define(
  'Question',
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
    noteId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    type: {
      type: DataTypes.ENUM('multiple_choice', 'short_answer', 'essay', 'true_false'),
      defaultValue: 'multiple_choice',
    },
    difficulty: {
      type: DataTypes.STRING,
      defaultValue: 'medium',
    },
    sourceTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: 'questions',
  }
);

module.exports = Question;

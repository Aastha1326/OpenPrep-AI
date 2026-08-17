const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PYQDraft = sequelize.define('PYQDraft', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  paperTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  questionNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  options: {
    type: DataTypes.JSON, // For storing array of options
    allowNull: true,
  },
  correctAnswer: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  year: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending_review', 'approved', 'rejected'),
    defaultValue: 'pending_review',
  }
});

module.exports = PYQDraft;

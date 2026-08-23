const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Quest = sequelize.define('Quest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('DAILY', 'WEEKLY', 'SPECIAL'),
    defaultValue: 'DAILY',
  },
  targetMetric: {
    type: DataTypes.STRING, // e.g. 'FLASHCARDS_REVIEWED', 'QUIZ_COMPLETED', 'STUDY_MINUTES'
    allowNull: false,
  },
  targetGoal: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  xpReward: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
  },
}, {
  timestamps: true,
});

module.exports = Quest;

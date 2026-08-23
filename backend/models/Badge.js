const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Badge = sequelize.define(
  'Badge',
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    svgIcon: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('streak', 'quiz', 'flashcard', 'study', 'achievement'),
      defaultValue: 'achievement',
    },
    criteriaType: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'streak_days',
    },
    criteriaThreshold: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Badge;

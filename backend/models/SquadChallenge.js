const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SquadChallenge = sequelize.define('SquadChallenge', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  squadId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'StudySquads',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  targetGoal: {
    type: DataTypes.INTEGER, // e.g. 500 points, or 100 flashcards
    allowNull: false,
  },
  currentProgress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  deadline: {
    type: DataTypes.DATE,
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  rewardPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  }
}, {
  timestamps: true,
});

module.exports = SquadChallenge;

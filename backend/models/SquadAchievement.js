const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SquadAchievement = sequelize.define('SquadAchievement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  squadId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  badgeCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unlockedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: 'squad_achievements'
});

module.exports = SquadAchievement;

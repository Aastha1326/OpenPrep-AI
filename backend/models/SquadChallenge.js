const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SquadChallenge = sequelize.define('SquadChallenge', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  squadId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  targetXp: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  currentXp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'failed'),
    defaultValue: 'active',
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'squad_challenges'
});

module.exports = SquadChallenge;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SquadChallengeContribution = sequelize.define('SquadChallengeContribution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  challengeId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  contributedXp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'squad_challenge_contributions',
  indexes: [
    {
      unique: true,
      fields: ['challengeId', 'userId'] // One contribution record per user per challenge
    }
  ]
});

module.exports = SquadChallengeContribution;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SquadActivityReaction = sequelize.define('SquadActivityReaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  activityId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  reactionType: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'squad_activity_reactions',
  indexes: [
    { fields: ['activityId', 'userId'], unique: true }
  ]
});

module.exports = SquadActivityReaction;

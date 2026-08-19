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
  emoji: {
    type: DataTypes.STRING(10),
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'squad_activity_reactions',
  indexes: [
    {
      unique: true,
      fields: ['activityId', 'userId', 'emoji']
    }
  ]
});

module.exports = SquadActivityReaction;

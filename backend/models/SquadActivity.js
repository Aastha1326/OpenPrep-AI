const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SquadActivity = sequelize.define('SquadActivity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  squadId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  activityType: {
    type: DataTypes.ENUM('quiz_completed', 'streak_hit', 'badge_unlocked'),
    allowNull: false
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reactionCounts: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  // Structured detail for the feed UI (quiz id, score, badge code, ...). The
  // service has always passed this through; it had no column to land in.
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'squad_activities',
  indexes: [
    { fields: ['squadId', 'createdAt'] }
  ]
});

module.exports = SquadActivity;
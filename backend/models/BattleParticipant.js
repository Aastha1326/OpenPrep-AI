const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BattleParticipant = sequelize.define(
  'BattleParticipant',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    battleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    correctCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    avgTimeMs: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['battleId'],
      },
      {
        fields: ['userId'],
      },
    ],
  }
);

module.exports = BattleParticipant;

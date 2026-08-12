const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BattleSession = sequelize.define(
  'BattleSession',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roomCode: {
      type: DataTypes.STRING(6),
      allowNull: false,
      unique: true,
    },
    hostUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    topicId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    questionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
    timePerQuestion: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
    },
    status: {
      type: DataTypes.ENUM('waiting', 'playing', 'finished'),
      defaultValue: 'waiting',
    },
    scores: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['roomCode'],
      },
    ],
  }
);

module.exports = BattleSession;

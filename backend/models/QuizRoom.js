const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const QuizRoom = sequelize.define(
  'QuizRoom',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roomId: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: true,
    },
    hostUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    currentQuestionIndex: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('waiting', 'in_progress', 'completed'),
      defaultValue: 'waiting',
    },
    participants: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        timePerQuestion: 20,
        maxParticipants: 10,
      },
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['roomId'],
      },
    ],
  }
);

module.exports = QuizRoom;

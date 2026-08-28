const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * ChatMessage — stores conversations for the study companion chatbot.
 * Each row is one message in a conversation thread, with role tracking
 * and context metadata for the AI assistant.
 */
const ChatMessage = sequelize.define(
  'ChatMessage',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user: { type: DataTypes.UUID, allowNull: false },
    sessionId: { type: DataTypes.UUID, allowNull: false },
    role: { type: DataTypes.ENUM('user', 'assistant', 'system'), defaultValue: 'user' },
    content: { type: DataTypes.TEXT, allowNull: false },
    topicContext: { type: DataTypes.STRING, allowNull: true },
    subjectContext: { type: DataTypes.STRING, allowNull: true },
    messageType: {
      type: DataTypes.ENUM('question', 'explanation', 'summary', 'tip', 'general'),
      defaultValue: 'general',
    },
    helpful: { type: DataTypes.BOOLEAN, allowNull: true },
    tokenCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'chatmessage_user_idx', fields: ['user'] },
      { name: 'chatmessage_session_idx', fields: ['sessionId'] },
      { name: 'chatmessage_user_session_idx', fields: ['user', 'sessionId'] },
    ],
  }
);

module.exports = ChatMessage;

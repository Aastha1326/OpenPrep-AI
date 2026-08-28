/**
 * @fileoverview One turn of follow-up conversation inside a doubt session.
 *
 * Chat turns live here rather than in DoubtSession.hints because the previous
 * implementation appended them to the hint array:
 *
 *   session.hints.push({ level: session.hints.length + 1, content: ... });
 *
 * and `revealHint` walks that same array by index. Asking a follow-up question
 * therefore grew the ladder, and the next "reveal hint" press replayed the
 * student's own message back at them as if it were a tutor hint. Separating
 * the two keeps the ladder a fixed, generated artefact and the conversation an
 * append-only log.
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MESSAGE_ROLES = ['student', 'tutor'];

const DoubtSessionMessage = sequelize.define(
  'DoubtSessionMessage',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...MESSAGE_ROLES),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'A message needs content.' },
      },
    },
    /**
     * The hint level the student had reached when this turn was sent.
     *
     * Recorded so the tutor prompt can be rebuilt exactly as it was, and so a
     * later review can tell whether a follow-up came before or after the full
     * solution was revealed.
     */
    hintLevelAtSend: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'DoubtSessionMessages',
    timestamps: true,
    indexes: [{ name: 'doubt_session_messages_session_idx', fields: ['sessionId', 'createdAt'] }],
  }
);

DoubtSessionMessage.MESSAGE_ROLES = MESSAGE_ROLES;

module.exports = DoubtSessionMessage;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CommentVote = sequelize.define('CommentVote', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  commentId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  value: { type: DataTypes.ENUM('up', 'down'), allowNull: false },
}, {
  tableName: 'CommentVotes',
  timestamps: true,
  indexes: [
    { name: 'comment_votes_unique_user_idx', unique: true, fields: ['commentId', 'userId'] },
  ],
});

module.exports = CommentVote;

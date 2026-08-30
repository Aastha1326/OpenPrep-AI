const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CommentFlag = sequelize.define('CommentFlag', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  commentId: { type: DataTypes.UUID, allowNull: false },
  reporterId: { type: DataTypes.UUID, allowNull: false },
  reason: { type: DataTypes.ENUM('spam', 'incorrect', 'abuse', 'other'), allowNull: false, defaultValue: 'other' },
}, {
  tableName: 'CommentFlags',
  timestamps: true,
  indexes: [
    { name: 'comment_flags_unique_reporter_idx', unique: true, fields: ['commentId', 'reporterId'] },
  ],
});

module.exports = CommentFlag;

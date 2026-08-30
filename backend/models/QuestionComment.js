const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const QuestionComment = sequelize.define('QuestionComment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  questionId: { type: DataTypes.UUID, allowNull: false },
  authorId: { type: DataTypes.UUID, allowNull: false },
  parentCommentId: { type: DataTypes.UUID, allowNull: true },
  depth: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  content: { type: DataTypes.TEXT, allowNull: false },
  latexContent: { type: DataTypes.TEXT, allowNull: true },
  upvotes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  downvotes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  reportCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  isVerifiedSolution: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isPinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isHidden: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'QuestionComments',
  timestamps: true,
  indexes: [
    { name: 'question_comments_question_idx', fields: ['questionId', 'createdAt'] },
    { name: 'question_comments_parent_idx', fields: ['parentCommentId'] },
  ],
});

module.exports = QuestionComment;

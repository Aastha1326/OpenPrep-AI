'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'isShadowBanned', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.createTable('QuestionComments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      questionId: { type: Sequelize.UUID, allowNull: false },
      authorId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      parentCommentId: { type: Sequelize.UUID, allowNull: true, references: { model: 'QuestionComments', key: 'id' }, onDelete: 'CASCADE' },
      depth: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      content: { type: Sequelize.TEXT, allowNull: false },
      latexContent: { type: Sequelize.TEXT, allowNull: true },
      upvotes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      downvotes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      reportCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      isVerifiedSolution: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      isPinned: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      isHidden: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('CommentVotes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      commentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'QuestionComments', key: 'id' }, onDelete: 'CASCADE' },
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      value: { type: Sequelize.ENUM('up', 'down'), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('CommentFlags', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      commentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'QuestionComments', key: 'id' }, onDelete: 'CASCADE' },
      reporterId: { type: Sequelize.UUID, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      reason: { type: Sequelize.ENUM('spam', 'incorrect', 'abuse', 'other'), allowNull: false, defaultValue: 'other' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('QuestionComments', ['questionId', 'createdAt'], { name: 'question_comments_question_idx' });
    await queryInterface.addIndex('QuestionComments', ['parentCommentId'], { name: 'question_comments_parent_idx' });
    await queryInterface.addIndex('CommentVotes', ['commentId', 'userId'], { name: 'comment_votes_unique_user_idx', unique: true });
    await queryInterface.addIndex('CommentFlags', ['commentId', 'reporterId'], { name: 'comment_flags_unique_reporter_idx', unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CommentFlags');
    await queryInterface.dropTable('CommentVotes');
    await queryInterface.dropTable('QuestionComments');
    await queryInterface.removeColumn('Users', 'isShadowBanned');
  },
};

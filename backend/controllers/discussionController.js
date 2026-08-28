const { sequelize, QuestionComment, CommentVote, User } = require('../models');
const moderation = require('../services/commentModerationService');

const MAX_CONTENT_LENGTH = 10000;
const MENTOR_ROLES = new Set(['admin', 'contributor', 'educator', 'mentor', 'teaching_assistant']);

const serializeComment = (comment, voteMap) => {
  const json = comment.toJSON();
  json.author = json.author ? {
    id: json.author.id,
    name: json.author.name,
    avatarUrl: json.author.avatarUrl,
  } : null;
  json.userVote = voteMap.get(String(comment.id)) || null;
  json.replies = [];
  return json;
};

exports.getQuestionComments = async (req, res, next) => {
  try {
    const comments = await QuestionComment.findAll({
      where: { questionId: req.params.id, isHidden: false },
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatarUrl'] }],
      order: [['isPinned', 'DESC'], ['createdAt', 'ASC']],
    });
    const votes = await CommentVote.findAll({
      where: { userId: req.user.id, commentId: comments.map((comment) => comment.id) },
      attributes: ['commentId', 'value'],
    });
    const voteMap = new Map(votes.map((vote) => [String(vote.commentId), vote.value]));
    const nodes = new Map(comments.map((comment) => [String(comment.id), serializeComment(comment, voteMap)]));
    const tree = [];
    nodes.forEach((node) => {
      if (node.parentCommentId && nodes.has(String(node.parentCommentId))) {
        nodes.get(String(node.parentCommentId)).replies.push(node);
      } else {
        tree.push(node);
      }
    });
    return res.status(200).json({ success: true, data: tree });
  } catch (error) {
    return next(error);
  }
};

exports.createQuestionComment = async (req, res, next) => {
  try {
    const { content, latexContent = null, parentCommentId = null } = req.body;
    const trimmedContent = String(content || '').trim();
    if (!trimmedContent || trimmedContent.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ success: false, error: `Content is required and must be at most ${MAX_CONTENT_LENGTH} characters.` });
    }

    let depth = 0;
    if (parentCommentId) {
      const parent = await QuestionComment.findOne({ where: { id: parentCommentId, questionId: req.params.id, isHidden: false } });
      if (!parent) return res.status(404).json({ success: false, error: 'Parent comment not found.' });
      depth = parent.depth + 1;
      if (depth > 2) return res.status(400).json({ success: false, error: 'Replies can only be nested three levels deep.' });
    }

    // Read the ban through the model rather than off req.user: a ban applied
    // mid-session would otherwise not bite until the token was refreshed.
    const shadowBanned = await moderation.shouldHideNewComment(req.user.id);

    const comment = await QuestionComment.create({
      questionId: req.params.id,
      authorId: req.user.id,
      parentCommentId,
      depth,
      content: trimmedContent,
      latexContent: latexContent ? String(latexContent).trim() : null,
      isHidden: shadowBanned,
    });
    return res.status(201).json({ success: true, data: comment, shadowBanned });
  } catch (error) {
    return next(error);
  }
};

exports.voteComment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const value = req.body.value || req.body.vote;
    if (!['up', 'down'].includes(value)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Vote must be up or down.' });
    }
    const comment = await QuestionComment.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!comment || comment.isHidden) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Comment not found.' });
    }
    const existing = await CommentVote.findOne({ where: { commentId: comment.id, userId: req.user.id }, transaction, lock: transaction.LOCK.UPDATE });
    if (existing && existing.value === value) {
      await existing.destroy({ transaction });
      comment[`${value}votes`] = Math.max(0, comment[`${value}votes`] - 1);
      await comment.save({ transaction });
      await transaction.commit();
      return res.status(200).json({ success: true, data: { vote: null, upvotes: comment.upvotes, downvotes: comment.downvotes } });
    }
    if (existing) {
      comment[`${existing.value}votes`] = Math.max(0, comment[`${existing.value}votes`] - 1);
      existing.value = value;
      await existing.save({ transaction });
    } else {
      await CommentVote.create({ commentId: comment.id, userId: req.user.id, value }, { transaction });
    }
    comment[`${value}votes`] += 1;
    await comment.save({ transaction });
    await transaction.commit();
    return res.status(200).json({ success: true, data: { vote: value, upvotes: comment.upvotes, downvotes: comment.downvotes } });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

exports.verifyComment = async (req, res, next) => {
  try {
    if (!MENTOR_ROLES.has(String(req.user.role || '').toLowerCase())) {
      return res.status(403).json({ success: false, error: 'Only verified educators or mentors can verify solutions.' });
    }
    const comment = await QuestionComment.findByPk(req.params.id);
    if (!comment || comment.isHidden) return res.status(404).json({ success: false, error: 'Comment not found.' });
    comment.isVerifiedSolution = req.body.verified !== false;
    await comment.save();
    return res.status(200).json({ success: true, data: comment });
  } catch (error) {
    return next(error);
  }
};

exports.flagComment = async (req, res, next) => {
  try {
    const result = await moderation.flagComment({
      commentId: req.params.id,
      reporterId: req.user.id,
      reason: req.body.reason,
    });

    return res.status(201).json({
      success: true,
      message: result.hidden
        ? 'Comment reported and hidden pending review.'
        : 'Comment reported.',
      data: { hidden: result.hidden },
    });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  }
};

/**
 * Lift a shadow ban.
 *
 * @route PATCH /api/admin/users/:id/shadow-ban
 */
exports.liftShadowBan = async (req, res, next) => {
  try {
    const result = await moderation.liftShadowBan({
      targetUserId: req.params.id,
      moderatorId: req.user.id,
      reason: req.body.reason,
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyLifted ? 'This account was not shadow banned.' : 'Shadow ban lifted.',
      data: result,
    });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  }
};

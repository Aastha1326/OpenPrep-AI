/**
 * @fileoverview Flagging, auto-hiding and shadow banning for question comments.
 *
 * Pulled out of discussionController because the flag path had four writes and
 * no transaction: the CommentFlag row, the reportCount bump, the User update
 * and the comment save all landed independently. A failure part way through
 * left a flag recorded against a counter that never moved, and two users
 * flagging at once could both read the same reportCount and neither would
 * cross the threshold.
 *
 * Collaborators are injected. Per CONTRIBUTING.md, vi.mock does not intercept
 * a CommonJS require, so a service that reaches for its own models cannot be
 * unit tested without a live database.
 */
const defaultModels = require('../models');

/** Reasons a comment can be reported. Anything else is recorded as 'other'. */
const FLAG_REASONS = ['spam', 'incorrect', 'abuse', 'other'];

/** The id recorded as the actor when the system bans without a human. */
const SYSTEM_MODERATOR_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Flags needed before a comment is hidden.
 *
 * Was an inline `>= 3` in the controller, so it could not be tuned per
 * environment - a staging instance with four testers could not exercise the
 * path without three of them agreeing.
 */
function hideThreshold(env = process.env) {
  const configured = parseInt(env.COMMENT_HIDE_FLAG_THRESHOLD, 10);
  return Number.isInteger(configured) && configured > 0 ? configured : 3;
}

/**
 * Hidden comments needed before the author is shadow banned.
 *
 * Deliberately higher than the hide threshold. The shipped code banned an
 * author the first time any single comment of theirs collected three flags,
 * which hands three coordinated users a permanent silence button. Hiding one
 * comment is cheap to get wrong; silencing an account is not.
 */
function banThreshold(env = process.env) {
  const configured = parseInt(env.AUTHOR_SHADOW_BAN_THRESHOLD, 10);
  return Number.isInteger(configured) && configured > 0 ? configured : 3;
}

/** Normalise a client-supplied reason onto the enum. */
function normaliseReason(reason) {
  return FLAG_REASONS.includes(reason) ? reason : 'other';
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/**
 * Write a moderation record, never failing the action it describes.
 *
 * An audit row is evidence, not a precondition. If the ledger write fails the
 * ban still has to stand - the alternative is a rollback that leaves abusive
 * content up because logging had a bad day.
 */
async function recordModerationAction(entry, { models = defaultModels, transaction } = {}) {
  try {
    return await models.ModeratorAuditLog.create(
      {
        moderatorId: entry.moderatorId || SYSTEM_MODERATOR_ID,
        targetUserId: entry.targetUserId || null,
        contentItemId: entry.contentItemId || null,
        actionType: entry.actionType,
        entityModel: entry.entityModel || 'QuestionComment',
        reason: entry.reason,
        metadata: entry.metadata || {},
        detectedByAI: false,
      },
      { transaction }
    );
  } catch (error) {
    console.warn('[Moderation] Failed to write audit log:', error.message);
    return null;
  }
}

/**
 * How many of an author's comments are currently hidden.
 *
 * Used as the ban signal instead of "this one comment hit three flags", so a
 * ban reflects a pattern across the account rather than one unpopular post.
 */
async function countHiddenComments(authorId, { models = defaultModels, transaction } = {}) {
  return models.QuestionComment.count({
    where: { authorId, isHidden: true },
    transaction,
  });
}

/**
 * Record one report against a comment.
 *
 * Everything happens inside a single transaction with a row lock on the
 * comment, so concurrent reporters serialise on the counter instead of racing
 * it. The unique index on (commentId, reporterId) is what stops one account
 * reporting the same comment repeatedly; hitting it surfaces as a 409.
 */
async function flagComment({ commentId, reporterId, reason }, deps = {}) {
  const models = deps.models || defaultModels;
  const env = deps.env || process.env;
  const sequelize = deps.sequelize || models.sequelize;

  const transaction = await sequelize.transaction();

  try {
    const comment = await models.QuestionComment.findByPk(commentId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!comment || comment.isHidden) {
      await transaction.rollback();
      throw httpError(404, 'Comment not found.');
    }

    if (String(comment.authorId) === String(reporterId)) {
      await transaction.rollback();
      throw httpError(400, 'You cannot report your own comment.');
    }

    await models.CommentFlag.create(
      { commentId: comment.id, reporterId, reason: normaliseReason(reason) },
      { transaction }
    );

    comment.reportCount += 1;

    const hideAt = hideThreshold(env);
    let hidden = false;
    let banned = false;

    if (comment.reportCount >= hideAt) {
      comment.isHidden = true;
      hidden = true;
    }

    await comment.save({ transaction });

    if (hidden) {
      await recordModerationAction(
        {
          targetUserId: comment.authorId,
          contentItemId: comment.id,
          actionType: 'CONTENT_HIDDEN',
          reason: `Hidden automatically after reaching ${hideAt} community reports.`,
          metadata: { reportCount: comment.reportCount, threshold: hideAt },
        },
        { models, transaction }
      );

      const hiddenCount = await countHiddenComments(comment.authorId, { models, transaction });
      const banAt = banThreshold(env);

      if (hiddenCount >= banAt) {
        // This is the write that did nothing before the User model declared
        // the attribute. Sequelize builds SET from rawAttributes, so an
        // undeclared key was dropped and no error was raised.
        await models.User.update(
          { isShadowBanned: true },
          { where: { id: comment.authorId }, transaction }
        );
        banned = true;

        await recordModerationAction(
          {
            targetUserId: comment.authorId,
            actionType: 'AI_AUTO_BAN',
            entityModel: 'User',
            reason: `Shadow banned automatically after ${hiddenCount} of this author's comments were hidden.`,
            metadata: { hiddenComments: hiddenCount, threshold: banAt },
          },
          { models, transaction }
        );
      }
    }

    await transaction.commit();

    return { reportCount: comment.reportCount, hidden, banned };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback().catch(() => {});
    }

    if (error?.name === 'SequelizeUniqueConstraintError') {
      throw httpError(409, 'You have already reported this comment.');
    }

    throw error;
  }
}

/**
 * Lift a shadow ban.
 *
 * Nothing cleared the flag before, so once the column was honoured the first
 * three users to press report would have silenced an account permanently with
 * no review and no appeal. A ban a moderator cannot undo is not moderation.
 */
async function liftShadowBan({ targetUserId, moderatorId, reason }, deps = {}) {
  const models = deps.models || defaultModels;

  const trimmedReason = String(reason || '').trim();
  if (trimmedReason.length < 5) {
    throw httpError(400, 'A reason of at least 5 characters is required to lift a ban.');
  }

  const user = await models.User.findByPk(targetUserId);
  if (!user) throw httpError(404, 'User not found.');

  if (!user.isShadowBanned) {
    return { userId: targetUserId, alreadyLifted: true, restoredComments: 0 };
  }

  user.isShadowBanned = false;
  await user.save();

  await recordModerationAction(
    {
      moderatorId,
      targetUserId,
      actionType: 'USER_UNBANNED',
      entityModel: 'User',
      reason: trimmedReason,
      metadata: {},
    },
    { models }
  );

  return { userId: targetUserId, alreadyLifted: false, restoredComments: 0 };
}

/**
 * Whether a new comment from this author should be created hidden.
 *
 * Read through the model rather than off `req.user`, because a ban applied
 * during a live session would otherwise not take effect until the token was
 * refreshed.
 */
async function shouldHideNewComment(authorId, deps = {}) {
  const models = deps.models || defaultModels;

  const user = await models.User.findByPk(authorId, { attributes: ['id', 'isShadowBanned'] });
  return Boolean(user?.isShadowBanned);
}

module.exports = {
  FLAG_REASONS,
  SYSTEM_MODERATOR_ID,
  hideThreshold,
  banThreshold,
  normaliseReason,
  recordModerationAction,
  countHiddenComments,
  flagComment,
  liftShadowBan,
  shouldHideNewComment,
};

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const moderation = require('../../services/commentModerationService');

const {
  hideThreshold,
  banThreshold,
  normaliseReason,
  recordModerationAction,
  countHiddenComments,
  flagComment,
  liftShadowBan,
  shouldHideNewComment,
  SYSTEM_MODERATOR_ID,
} = moderation;

/**
 * A transaction double that records whether it was committed or rolled back,
 * so a test can assert the flag path is atomic rather than four loose writes.
 */
function makeTransaction() {
  const transaction = {
    finished: null,
    LOCK: { UPDATE: 'UPDATE' },
    commit: vi.fn(async () => {
      transaction.finished = 'commit';
    }),
    rollback: vi.fn(async () => {
      transaction.finished = 'rollback';
    }),
  };
  return transaction;
}

function makeComment(overrides = {}) {
  const comment = {
    id: 'comment-1',
    authorId: 'author-1',
    reportCount: 0,
    isHidden: false,
    ...overrides,
  };
  comment.save = vi.fn(async () => comment);
  return comment;
}

function makeDeps({ comment, hiddenCount = 0, user = null, env = {}, flagCreate } = {}) {
  const transaction = makeTransaction();
  const auditRows = [];
  const userUpdates = [];

  const models = {
    sequelize: { transaction: vi.fn(async () => transaction) },
    QuestionComment: {
      findByPk: vi.fn(async () => comment),
      count: vi.fn(async () => hiddenCount),
    },
    CommentFlag: {
      create: flagCreate || vi.fn(async (values) => values),
    },
    User: {
      update: vi.fn(async (values, options) => {
        userUpdates.push({ values, options });
        return [1];
      }),
      findByPk: vi.fn(async () => user),
    },
    ModeratorAuditLog: {
      create: vi.fn(async (values) => {
        auditRows.push(values);
        return values;
      }),
    },
  };

  return { models, env, transaction, auditRows, userUpdates, deps: { models, env } };
}

describe('commentModerationService — thresholds', () => {
  it('defaults to three reports before a comment is hidden', () => {
    expect(hideThreshold({})).toBe(3);
  });

  it('reads the hide threshold from the environment', () => {
    expect(hideThreshold({ COMMENT_HIDE_FLAG_THRESHOLD: '5' })).toBe(5);
  });

  it('ignores a nonsense hide threshold', () => {
    expect(hideThreshold({ COMMENT_HIDE_FLAG_THRESHOLD: 'lots' })).toBe(3);
    expect(hideThreshold({ COMMENT_HIDE_FLAG_THRESHOLD: '0' })).toBe(3);
    expect(hideThreshold({ COMMENT_HIDE_FLAG_THRESHOLD: '-2' })).toBe(3);
  });

  it('reads the ban threshold from the environment', () => {
    expect(banThreshold({})).toBe(3);
    expect(banThreshold({ AUTHOR_SHADOW_BAN_THRESHOLD: '10' })).toBe(10);
  });
});

describe('commentModerationService — normaliseReason', () => {
  it('keeps a known reason', () => {
    expect(normaliseReason('spam')).toBe('spam');
    expect(normaliseReason('abuse')).toBe('abuse');
  });

  it('collapses anything unknown onto other', () => {
    expect(normaliseReason('because-i-said-so')).toBe('other');
    expect(normaliseReason(undefined)).toBe('other');
    expect(normaliseReason(null)).toBe('other');
  });
});

describe('commentModerationService — flagComment', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('records the flag and bumps the counter inside one transaction', async () => {
    const comment = makeComment();
    const { deps, models, transaction } = makeDeps({ comment });

    const result = await flagComment(
      { commentId: 'comment-1', reporterId: 'reporter-1', reason: 'spam' },
      deps
    );

    expect(result).toEqual({ reportCount: 1, hidden: false, banned: false });
    expect(models.CommentFlag.create).toHaveBeenCalledWith(
      { commentId: 'comment-1', reporterId: 'reporter-1', reason: 'spam' },
      { transaction }
    );
    expect(comment.save).toHaveBeenCalledWith({ transaction });
    expect(transaction.commit).toHaveBeenCalledOnce();
    expect(transaction.rollback).not.toHaveBeenCalled();
  });

  it('takes a row lock so concurrent reporters serialise on the counter', async () => {
    const comment = makeComment();
    const { deps, models, transaction } = makeDeps({ comment });

    await flagComment({ commentId: 'comment-1', reporterId: 'r1' }, deps);

    expect(models.QuestionComment.findByPk).toHaveBeenCalledWith('comment-1', {
      transaction,
      lock: 'UPDATE',
    });
  });

  it('hides the comment once the threshold is reached', async () => {
    const comment = makeComment({ reportCount: 2 });
    const { deps, auditRows } = makeDeps({ comment });

    const result = await flagComment({ commentId: 'comment-1', reporterId: 'r3' }, deps);

    expect(result.hidden).toBe(true);
    expect(comment.isHidden).toBe(true);
    expect(auditRows.some((row) => row.actionType === 'CONTENT_HIDDEN')).toBe(true);
  });

  it('leaves the comment visible below the threshold', async () => {
    const comment = makeComment({ reportCount: 0 });
    const { deps, auditRows } = makeDeps({ comment });

    const result = await flagComment({ commentId: 'comment-1', reporterId: 'r1' }, deps);

    expect(result.hidden).toBe(false);
    expect(comment.isHidden).toBe(false);
    expect(auditRows).toHaveLength(0);
  });

  it('honours a raised hide threshold', async () => {
    const comment = makeComment({ reportCount: 2 });
    const { deps } = makeDeps({ comment, env: { COMMENT_HIDE_FLAG_THRESHOLD: '5' } });

    const result = await flagComment({ commentId: 'comment-1', reporterId: 'r3' }, deps);

    expect(result.hidden).toBe(false);
  });

  it('actually writes the shadow ban when the author crosses the ban threshold', async () => {
    // The regression this PR is about: User.update({ isShadowBanned: true })
    // silently updated nothing because the attribute was not declared.
    const comment = makeComment({ reportCount: 2 });
    const { deps, userUpdates, transaction } = makeDeps({ comment, hiddenCount: 3 });

    const result = await flagComment({ commentId: 'comment-1', reporterId: 'r3' }, deps);

    expect(result.banned).toBe(true);
    expect(userUpdates).toHaveLength(1);
    expect(userUpdates[0].values).toEqual({ isShadowBanned: true });
    expect(userUpdates[0].options).toMatchObject({ where: { id: 'author-1' }, transaction });
  });

  it('does not ban an author whose other comments are still visible', async () => {
    const comment = makeComment({ reportCount: 2 });
    const { deps, userUpdates } = makeDeps({ comment, hiddenCount: 1 });

    const result = await flagComment({ commentId: 'comment-1', reporterId: 'r3' }, deps);

    expect(result.hidden).toBe(true);
    expect(result.banned).toBe(false);
    expect(userUpdates).toHaveLength(0);
  });

  it('does not ban on a single hidden comment even at the hide threshold', async () => {
    // Three coordinated reporters could previously silence an account
    // permanently by flagging one post. A ban now needs a pattern.
    const comment = makeComment({ reportCount: 2 });
    const { deps, userUpdates } = makeDeps({ comment, hiddenCount: 1 });

    await flagComment({ commentId: 'comment-1', reporterId: 'r3' }, deps);

    expect(userUpdates).toHaveLength(0);
  });

  it('writes an audit row naming the ban reason', async () => {
    const comment = makeComment({ reportCount: 2 });
    const { deps, auditRows } = makeDeps({ comment, hiddenCount: 3 });

    await flagComment({ commentId: 'comment-1', reporterId: 'r3' }, deps);

    const ban = auditRows.find((row) => row.actionType === 'AI_AUTO_BAN');
    expect(ban).toBeDefined();
    expect(ban.targetUserId).toBe('author-1');
    expect(ban.reason).toContain('3');
    expect(ban.moderatorId).toBe(SYSTEM_MODERATOR_ID);
  });

  it('404s an unknown comment and rolls back', async () => {
    const { deps, transaction } = makeDeps({ comment: null });

    await expect(flagComment({ commentId: 'nope', reporterId: 'r1' }, deps)).rejects.toMatchObject({
      status: 404,
    });
    expect(transaction.rollback).toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  it('404s an already hidden comment', async () => {
    const { deps } = makeDeps({ comment: makeComment({ isHidden: true }) });

    await expect(flagComment({ commentId: 'comment-1', reporterId: 'r1' }, deps)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('refuses a self-report', async () => {
    const { deps, models } = makeDeps({ comment: makeComment({ authorId: 'author-1' }) });

    await expect(
      flagComment({ commentId: 'comment-1', reporterId: 'author-1' }, deps)
    ).rejects.toMatchObject({ status: 400 });

    expect(models.CommentFlag.create).not.toHaveBeenCalled();
  });

  it('turns a duplicate report into a 409', async () => {
    const uniqueError = new Error('duplicate');
    uniqueError.name = 'SequelizeUniqueConstraintError';
    const { deps, transaction } = makeDeps({
      comment: makeComment(),
      flagCreate: vi.fn(async () => {
        throw uniqueError;
      }),
    });

    await expect(flagComment({ commentId: 'comment-1', reporterId: 'r1' }, deps)).rejects.toMatchObject({
      status: 409,
    });
    expect(transaction.rollback).toHaveBeenCalled();
  });

  it('rolls back rather than leaving a flag against a stale counter', async () => {
    const comment = makeComment();
    comment.save = vi.fn(async () => {
      throw new Error('write conflict');
    });
    const { deps, transaction } = makeDeps({ comment });

    await expect(flagComment({ commentId: 'comment-1', reporterId: 'r1' }, deps)).rejects.toThrow(
      'write conflict'
    );
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalled();
  });

  it('still hides the comment when the audit write fails', async () => {
    const comment = makeComment({ reportCount: 2 });
    const { deps, models } = makeDeps({ comment });
    models.ModeratorAuditLog.create = vi.fn(async () => {
      throw new Error('audit table missing');
    });

    const result = await flagComment({ commentId: 'comment-1', reporterId: 'r3' }, deps);

    // Evidence is not a precondition; the alternative is abusive content
    // staying up because logging had a bad day.
    expect(result.hidden).toBe(true);
    expect(comment.isHidden).toBe(true);
  });

  it('normalises an unrecognised reason before writing it', async () => {
    const { deps, models } = makeDeps({ comment: makeComment() });

    await flagComment({ commentId: 'comment-1', reporterId: 'r1', reason: 'made-up' }, deps);

    expect(models.CommentFlag.create.mock.calls[0][0].reason).toBe('other');
  });
});

describe('commentModerationService — countHiddenComments', () => {
  it('counts only this author’s hidden comments', async () => {
    const models = { QuestionComment: { count: vi.fn(async () => 4) } };

    const total = await countHiddenComments('author-9', { models });

    expect(total).toBe(4);
    expect(models.QuestionComment.count).toHaveBeenCalledWith({
      where: { authorId: 'author-9', isHidden: true },
      transaction: undefined,
    });
  });
});

describe('commentModerationService — shouldHideNewComment', () => {
  it('hides a comment from a shadow-banned author', async () => {
    const models = { User: { findByPk: vi.fn(async () => ({ id: 'u', isShadowBanned: true })) } };

    await expect(shouldHideNewComment('u', { models })).resolves.toBe(true);
  });

  it('does not hide a comment from an ordinary author', async () => {
    const models = { User: { findByPk: vi.fn(async () => ({ id: 'u', isShadowBanned: false })) } };

    await expect(shouldHideNewComment('u', { models })).resolves.toBe(false);
  });

  it('does not hide when the author cannot be loaded', async () => {
    const models = { User: { findByPk: vi.fn(async () => null) } };

    await expect(shouldHideNewComment('u', { models })).resolves.toBe(false);
  });

  it('reads the ban from the database, not from the session token', async () => {
    // A ban applied mid-session has to bite on the next request, not on the
    // next token refresh.
    const models = { User: { findByPk: vi.fn(async () => ({ isShadowBanned: true })) } };

    await shouldHideNewComment('u', { models });

    expect(models.User.findByPk).toHaveBeenCalledWith('u', {
      attributes: ['id', 'isShadowBanned'],
    });
  });
});

describe('commentModerationService — liftShadowBan', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  function bannedUser() {
    const user = { id: 'author-1', isShadowBanned: true };
    user.save = vi.fn(async () => user);
    return user;
  }

  it('clears the ban and records who lifted it', async () => {
    const user = bannedUser();
    const auditRows = [];
    const models = {
      User: { findByPk: vi.fn(async () => user) },
      ModeratorAuditLog: {
        create: vi.fn(async (values) => {
          auditRows.push(values);
          return values;
        }),
      },
    };

    const result = await liftShadowBan(
      { targetUserId: 'author-1', moderatorId: 'mod-1', reason: 'Appeal upheld on review.' },
      { models }
    );

    expect(result.alreadyLifted).toBe(false);
    expect(user.isShadowBanned).toBe(false);
    expect(user.save).toHaveBeenCalledOnce();
    expect(auditRows[0]).toMatchObject({
      actionType: 'USER_UNBANNED',
      moderatorId: 'mod-1',
      targetUserId: 'author-1',
      reason: 'Appeal upheld on review.',
    });
  });

  it('requires a reason', async () => {
    const models = { User: { findByPk: vi.fn() } };

    await expect(
      liftShadowBan({ targetUserId: 'author-1', moderatorId: 'mod-1', reason: 'ok' }, { models })
    ).rejects.toMatchObject({ status: 400 });

    expect(models.User.findByPk).not.toHaveBeenCalled();
  });

  it('404s an unknown user', async () => {
    const models = { User: { findByPk: vi.fn(async () => null) } };

    await expect(
      liftShadowBan(
        { targetUserId: 'nope', moderatorId: 'mod-1', reason: 'Appeal upheld.' },
        { models }
      )
    ).rejects.toMatchObject({ status: 404 });
  });

  it('is a no-op on an account that was never banned', async () => {
    const user = { id: 'u', isShadowBanned: false, save: vi.fn() };
    const models = { User: { findByPk: vi.fn(async () => user) }, ModeratorAuditLog: { create: vi.fn() } };

    const result = await liftShadowBan(
      { targetUserId: 'u', moderatorId: 'mod-1', reason: 'Checked on review.' },
      { models }
    );

    expect(result.alreadyLifted).toBe(true);
    expect(user.save).not.toHaveBeenCalled();
    expect(models.ModeratorAuditLog.create).not.toHaveBeenCalled();
  });
});

describe('commentModerationService — recordModerationAction', () => {
  it('defaults the actor to the system id', async () => {
    const rows = [];
    const models = { ModeratorAuditLog: { create: vi.fn(async (v) => rows.push(v)) } };

    await recordModerationAction(
      { actionType: 'CONTENT_HIDDEN', reason: 'threshold reached' },
      { models }
    );

    expect(rows[0].moderatorId).toBe(SYSTEM_MODERATOR_ID);
    expect(rows[0].entityModel).toBe('QuestionComment');
    expect(rows[0].detectedByAI).toBe(false);
  });

  it('returns null instead of throwing when the ledger write fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const models = {
      ModeratorAuditLog: {
        create: vi.fn(async () => {
          throw new Error('relation does not exist');
        }),
      },
    };

    await expect(
      recordModerationAction({ actionType: 'USER_UNBANNED', reason: 'x' }, { models })
    ).resolves.toBeNull();

    warn.mockRestore();
  });
});

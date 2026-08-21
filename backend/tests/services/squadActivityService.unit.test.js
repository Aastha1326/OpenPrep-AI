const {
  logSquadActivity,
  getActivityFeed,
  reactToActivity,
  SUPPORTED_EMOJIS,
} = require('../../services/squadActivityService');

/**
 * Models are injected rather than mocked: the service reaches its real models
 * through CommonJS `require`, which `vi.mock` does not intercept (see
 * CONTRIBUTING.md). Every double below is handed in through the `deps`
 * argument instead.
 */

const makeActivityRow = (overrides = {}) => ({
  id: 'act-1',
  squadId: 'squad-1',
  userId: 'user-1',
  activityType: 'quiz_completed',
  message: 'completed "Algebra" scoring 90%',
  metadata: {},
  reactionCounts: {},
  createdAt: new Date('2026-08-20T10:00:00Z'),
  save: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeDeps = (overrides = {}) => ({
  squadActivityModel: {
    create: vi.fn(async (values) => makeActivityRow(values)),
    findAll: vi.fn().mockResolvedValue([]),
    findByPk: vi.fn().mockResolvedValue(null),
  },
  reactionModel: {
    findAll: vi.fn().mockResolvedValue([]),
    findOrCreate: vi.fn(),
  },
  squadMemberModel: {
    findAll: vi.fn().mockResolvedValue([]),
  },
  userModel: {},
  ...overrides,
});

describe('squadActivityService', () => {
  let originalIo;

  beforeEach(() => {
    vi.clearAllMocks();
    originalIo = global.io;
    global.io = undefined;
  });

  afterEach(() => {
    global.io = originalIo;
  });

  describe('logSquadActivity', () => {
    it('writes the milestone text to the NOT NULL message column', async () => {
      const deps = makeDeps();
      deps.squadMemberModel.findAll.mockResolvedValue([{ squadId: 'squad-1' }]);

      await logSquadActivity('user-1', 'quiz_completed', 'completed "Algebra" scoring 90%', {}, deps);

      expect(deps.squadActivityModel.create).toHaveBeenCalledTimes(1);
      const values = deps.squadActivityModel.create.mock.calls[0][0];
      expect(values.message).toBe('completed "Algebra" scoring 90%');
      expect(values.squadId).toBe('squad-1');
      expect(values.userId).toBe('user-1');
      expect(values.activityType).toBe('quiz_completed');
    });

    it('never writes a `description` key, which the model has no column for', async () => {
      const deps = makeDeps();
      deps.squadMemberModel.findAll.mockResolvedValue([{ squadId: 'squad-1' }]);

      await logSquadActivity('user-1', 'streak_hit', 'hit a 7-day streak', {}, deps);

      const values = deps.squadActivityModel.create.mock.calls[0][0];
      expect(values).not.toHaveProperty('description');
      expect(Object.keys(values).sort()).toEqual(
        ['activityType', 'message', 'metadata', 'squadId', 'userId'].sort()
      );
    });

    it('persists structured metadata alongside the message', async () => {
      const deps = makeDeps();
      deps.squadMemberModel.findAll.mockResolvedValue([{ squadId: 'squad-1' }]);

      await logSquadActivity(
        'user-1',
        'badge_unlocked',
        'unlocked the "Week Warrior" badge',
        { badgeId: 'week_warrior' },
        deps
      );

      expect(deps.squadActivityModel.create.mock.calls[0][0].metadata).toEqual({
        badgeId: 'week_warrior',
      });
    });

    it('posts one row per squad the user belongs to', async () => {
      const deps = makeDeps();
      deps.squadMemberModel.findAll.mockResolvedValue([
        { squadId: 'squad-1' },
        { squadId: 'squad-2' },
        { squadId: 'squad-3' },
      ]);

      const result = await logSquadActivity('user-1', 'streak_hit', 'hit a 14-day streak', {}, deps);

      expect(result.posted).toBe(3);
      expect(deps.squadActivityModel.create).toHaveBeenCalledTimes(3);
    });

    it('swallows a write failure instead of failing the caller', async () => {
      const deps = makeDeps();
      deps.squadMemberModel.findAll.mockResolvedValue([{ squadId: 'squad-1' }]);
      deps.squadActivityModel.create.mockRejectedValue(
        new Error('null value in column "message" violates not-null constraint')
      );
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await logSquadActivity('user-1', 'quiz_completed', 'completed a quiz', {}, deps);

      expect(result.posted).toBe(0);
      expect(result.error).toMatch(/not-null/);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('is a no-op when the user belongs to no squads', async () => {
      const deps = makeDeps();
      deps.squadMemberModel.findAll.mockResolvedValue([]);

      const result = await logSquadActivity('user-1', 'quiz_completed', 'completed a quiz', {}, deps);

      expect(result).toEqual({ posted: 0, skipped: false });
      expect(deps.squadActivityModel.create).not.toHaveBeenCalled();
    });

    it('skips activities with no message rather than attempting an invalid insert', async () => {
      const deps = makeDeps();

      const result = await logSquadActivity('user-1', 'quiz_completed', '', {}, deps);

      expect(result.skipped).toBe(true);
      expect(deps.squadMemberModel.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getActivityFeed', () => {
    it('orders by createdAt, not by the non-existent timestamp column', async () => {
      const deps = makeDeps();
      deps.squadActivityModel.findAll.mockResolvedValue([]);

      await getActivityFeed('squad-1', 'user-1', 50, 0, deps);

      const query = deps.squadActivityModel.findAll.mock.calls[0][0];
      expect(query.order).toEqual([['createdAt', 'DESC']]);
      expect(JSON.stringify(query.order)).not.toContain('timestamp');
    });

    it('clamps limit and offset to a sane range', async () => {
      const deps = makeDeps();

      await getActivityFeed('squad-1', 'user-1', 5000, -20, deps);

      const query = deps.squadActivityModel.findAll.mock.calls[0][0];
      expect(query.limit).toBe(100);
      expect(query.offset).toBe(0);
    });

    it('marks which reactions belong to the requesting user', async () => {
      const deps = makeDeps();
      deps.squadActivityModel.findAll.mockResolvedValue([
        {
          toJSON: () => ({
            id: 'act-1',
            message: 'completed a quiz',
            SquadActivityReactions: [
              { userId: 'user-1', emoji: '🔥' },
              { userId: 'user-2', emoji: '👏' },
            ],
          }),
        },
      ]);

      const feed = await getActivityFeed('squad-1', 'user-1', 50, 0, deps);

      expect(feed[0].myReactions).toEqual(['🔥']);
    });
  });

  describe('reactToActivity', () => {
    it('rejects an emoji outside the supported set', async () => {
      const deps = makeDeps();

      await expect(reactToActivity('act-1', 'user-1', '🧨', 'squad-1', deps)).rejects.toThrow(
        'Unsupported reaction emoji'
      );
      expect(deps.squadActivityModel.findByPk).not.toHaveBeenCalled();
    });

    it('rejects a reaction on an activity belonging to another squad', async () => {
      const deps = makeDeps();
      deps.squadActivityModel.findByPk.mockResolvedValue(
        makeActivityRow({ squadId: 'squad-2' })
      );

      await expect(reactToActivity('act-1', 'user-1', '🔥', 'squad-1', deps)).rejects.toThrow(
        'Activity does not belong to this squad'
      );
      expect(deps.reactionModel.findOrCreate).not.toHaveBeenCalled();
    });

    it('adds a reaction and recomputes the stored tally', async () => {
      const deps = makeDeps();
      const activity = makeActivityRow();
      deps.squadActivityModel.findByPk.mockResolvedValue(activity);
      deps.reactionModel.findOrCreate.mockResolvedValue([{ destroy: vi.fn() }, true]);
      deps.reactionModel.findAll.mockResolvedValue([
        { emoji: '🔥' },
        { emoji: '🔥' },
        { emoji: '👏' },
      ]);

      const result = await reactToActivity('act-1', 'user-1', '🔥', 'squad-1', deps);

      expect(result.action).toBe('added');
      expect(result.reactionCounts).toEqual({ '🔥': 2, '👏': 1 });
      expect(activity.reactionCounts).toEqual({ '🔥': 2, '👏': 1 });
      expect(activity.save).toHaveBeenCalled();
    });

    it('removes an existing reaction and drops it from the tally', async () => {
      const deps = makeDeps();
      const activity = makeActivityRow({ reactionCounts: { '🔥': 1 } });
      const destroy = vi.fn().mockResolvedValue(undefined);
      deps.squadActivityModel.findByPk.mockResolvedValue(activity);
      deps.reactionModel.findOrCreate.mockResolvedValue([{ destroy }, false]);
      deps.reactionModel.findAll.mockResolvedValue([]);

      const result = await reactToActivity('act-1', 'user-1', '🔥', 'squad-1', deps);

      expect(destroy).toHaveBeenCalled();
      expect(result.action).toBe('removed');
      expect(result.reactionCounts).toEqual({});
      expect(activity.reactionCounts).toEqual({});
    });

    it('reports a missing activity', async () => {
      const deps = makeDeps();
      deps.squadActivityModel.findByPk.mockResolvedValue(null);

      await expect(reactToActivity('nope', 'user-1', '🔥', 'squad-1', deps)).rejects.toThrow(
        'Activity not found'
      );
    });

    it('exposes exactly the emoji set the feed renders', () => {
      expect(SUPPORTED_EMOJIS).toEqual(['🔥', '👏', '🎉', '💪', '❤️']);
    });
  });
});

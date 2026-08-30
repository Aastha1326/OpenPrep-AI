const xpRateLimiter = require('../../services/xpRateLimiter');
const redisService = require('../../services/redisService');

const {
  consume,
  refund,
  getUsage,
  estimateSlidingUsage,
  HOURLY_XP_CAP,
  WINDOW_MS,
  __resetLocalBuckets,
} = xpRateLimiter;

/**
 * These exercise the in-process fallback path. redisService is a singleton the
 * limiter reaches through require, so `isReady` is forced false rather than
 * mocked — vi.mock does not intercept a CommonJS require (see CONTRIBUTING.md).
 */

// A timestamp exactly on a window boundary, so "elapsed within the bucket" is
// whatever the test adds to it.
const WINDOW_START = Math.floor(1_800_000_000_000 / WINDOW_MS) * WINDOW_MS;

describe('estimateSlidingUsage', () => {
  it('carries the whole previous bucket at the start of a window', () => {
    expect(estimateSlidingUsage(500, 0, 0)).toBe(500);
  });

  it('carries none of it at the end of a window', () => {
    expect(estimateSlidingUsage(500, 0, 1)).toBe(0);
  });

  it('carries a proportional share partway through', () => {
    expect(estimateSlidingUsage(400, 100, 0.25)).toBe(400); // 300 + 100
    expect(estimateSlidingUsage(400, 100, 0.5)).toBe(300); // 200 + 100
  });

  it('never reports a negative usage', () => {
    expect(estimateSlidingUsage(-100, -50, 0.5)).toBe(0);
  });
});

describe('xpRateLimiter (in-process fallback)', () => {
  let wasReady;
  let warnSpy;

  beforeEach(() => {
    wasReady = redisService.isReady;
    redisService.isReady = false;
    __resetLocalBuckets();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    redisService.isReady = wasReady;
    warnSpy.mockRestore();
  });

  it('grants the full amount when the user is well under the cap', async () => {
    const result = await consume('user-1', 100, WINDOW_START);

    expect(result.granted).toBe(100);
    expect(result.capped).toBe(false);
    expect(result.remaining).toBe(HOURLY_XP_CAP - 100);
  });

  it('accumulates across sequential awards inside one window', async () => {
    const now = WINDOW_START;
    for (let i = 0; i < 4; i += 1) {
      await consume('user-2', 100, now);
    }

    const { usage, remaining } = await getUsage('user-2', now);
    expect(usage).toBe(400);
    expect(remaining).toBe(100);
  });

  it('grants only the remainder once the cap is nearly spent', async () => {
    const now = WINDOW_START;
    await consume('user-3', 450, now);

    const result = await consume('user-3', 100, now);

    expect(result.granted).toBe(50);
    expect(result.capped).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('grants nothing once the cap is spent', async () => {
    const now = WINDOW_START;
    await consume('user-4', HOURLY_XP_CAP, now);

    const result = await consume('user-4', 100, now);

    expect(result.granted).toBe(0);
    expect(result.capped).toBe(true);
  });

  it('does not hand back the whole allowance at the top of the hour', async () => {
    // The bug: a bucket keyed on Math.floor(now / 3600000) reset here, so a
    // user could spend the cap at 10:59 and the cap again at 11:00.
    const justBeforeBoundary = WINDOW_START + WINDOW_MS - 60_000;
    await consume('user-5', HOURLY_XP_CAP, justBeforeBoundary);

    const justAfterBoundary = WINDOW_START + WINDOW_MS + 60_000;
    const result = await consume('user-5', 500, justAfterBoundary);

    expect(result.granted).toBeLessThan(100);
  });

  it('releases the allowance gradually as the window slides', async () => {
    const start = WINDOW_START;
    await consume('user-6', HOURLY_XP_CAP, start);

    const halfwayThroughNextWindow = WINDOW_START + WINDOW_MS + WINDOW_MS / 2;
    const { usage, remaining } = await getUsage('user-6', halfwayThroughNextWindow);

    // Half of the previous window's 500 still counts.
    expect(usage).toBe(250);
    expect(remaining).toBe(250);
  });

  it('has released the full allowance a window later', async () => {
    await consume('user-7', HOURLY_XP_CAP, WINDOW_START);

    const twoWindowsLater = WINDOW_START + WINDOW_MS * 2;
    const { usage, remaining } = await getUsage('user-7', twoWindowsLater);

    expect(usage).toBe(0);
    expect(remaining).toBe(HOURLY_XP_CAP);
  });

  it('counts every award when several are claimed concurrently', async () => {
    // The old get-then-set let ten parallel awards all read 0 and all pass.
    const now = WINDOW_START;
    const results = await Promise.all(
      Array.from({ length: 10 }, () => consume('user-8', 100, now))
    );

    const totalGranted = results.reduce((sum, r) => sum + r.granted, 0);
    expect(totalGranted).toBe(HOURLY_XP_CAP);
  });

  it('tracks each user separately', async () => {
    const now = WINDOW_START;
    await consume('user-9', HOURLY_XP_CAP, now);

    const other = await consume('user-10', 100, now);
    expect(other.granted).toBe(100);
  });

  it('reports the degraded fallback so the caller can say so', async () => {
    const result = await consume('user-11', 10, WINDOW_START);
    expect(result.degraded).toBe(true);
  });

  it('ignores a zero or negative request', async () => {
    expect((await consume('user-12', 0, WINDOW_START)).granted).toBe(0);
    expect((await consume('user-12', -50, WINDOW_START)).granted).toBe(0);

    const { usage } = await getUsage('user-12', WINDOW_START);
    expect(usage).toBe(0);
  });

  it('returns allowance on refund so a failed write does not cost the user', async () => {
    const now = WINDOW_START;
    await consume('user-13', 200, now);
    await refund('user-13', 200, now);

    const { usage, remaining } = await getUsage('user-13', now);
    expect(usage).toBe(0);
    expect(remaining).toBe(HOURLY_XP_CAP);
  });

  it('does not let a refund push usage below zero', async () => {
    const now = WINDOW_START;
    await refund('user-14', 200, now);

    const { usage } = await getUsage('user-14', now);
    expect(usage).toBe(0);
  });
});

describe('xpRateLimiter (Redis path)', () => {
  let wasReady;
  let incrSpy;
  let getSpy;

  beforeEach(() => {
    wasReady = redisService.isReady;
    redisService.isReady = true;
    __resetLocalBuckets();
    getSpy = vi.spyOn(redisService, 'get').mockResolvedValue(0);
    incrSpy = vi.spyOn(redisService, 'incrBy').mockResolvedValue(100);
  });

  afterEach(() => {
    redisService.isReady = wasReady;
    getSpy.mockRestore();
    incrSpy.mockRestore();
  });

  it('claims the allowance with an atomic increment, not a read-then-write', async () => {
    await consume('user-r1', 100, WINDOW_START);

    expect(incrSpy).toHaveBeenCalledTimes(1);
    const [key, amount] = incrSpy.mock.calls[0];
    expect(key).toContain('user-r1');
    expect(amount).toBe(100);
  });

  it('falls back and flags degraded when the increment fails mid-flight', async () => {
    incrSpy.mockResolvedValue(null);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await consume('user-r2', 100, WINDOW_START);

    expect(result.granted).toBe(100);
    expect(result.degraded).toBe(true);
    warn.mockRestore();
  });

  it('reads both the current and previous bucket', async () => {
    await getUsage('user-r3', WINDOW_START + WINDOW_MS / 2);

    expect(getSpy).toHaveBeenCalledTimes(2);
    const keys = getSpy.mock.calls.map((call) => call[0]);
    const indices = keys.map((k) => Number(k.split(':').pop()));
    expect(indices[0] - indices[1]).toBe(1);
  });
});

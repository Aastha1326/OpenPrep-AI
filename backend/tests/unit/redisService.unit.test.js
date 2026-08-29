import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const fs = require('fs');
const path = require('path');

const SERVICE_PATH = path.join(__dirname, '..', '..', 'services', 'redisService.js');

const redisService = require('../../services/redisService');

/**
 * A stand-in for the ioredis client.
 *
 * Every method records its arguments so a test can assert on the exact command
 * that went to Redis, which is the part that regressed: the pattern-delete
 * method lost its signature in a merge and its body leaked into `zcard`,
 * leaving the file unparseable.
 */
function fakeClient(overrides = {}) {
  return {
    calls: [],
    async get(key) {
      this.calls.push(['get', key]);
      return this.store?.[key] ?? null;
    },
    async set(key, value, mode, ttl) {
      this.calls.push(['set', key, value, mode, ttl]);
      return 'OK';
    },
    async keys(pattern) {
      this.calls.push(['keys', pattern]);
      return this.matching ?? [];
    },
    async del(keys) {
      this.calls.push(['del', keys]);
      return Array.isArray(keys) ? keys.length : 1;
    },
    async incrby(key, amount) {
      this.calls.push(['incrby', key, amount]);
      this.counters = this.counters || {};
      this.counters[key] = (this.counters[key] || 0) + amount;
      return this.counters[key];
    },
    async expire(key, ttl) {
      this.calls.push(['expire', key, ttl]);
      return 1;
    },
    async zadd(key, score, member) {
      this.calls.push(['zadd', key, score, member]);
      return 1;
    },
    async zcard(key) {
      this.calls.push(['zcard', key]);
      return this.cardinality ?? 0;
    },
    ...overrides,
  };
}

/** Point the singleton at a fake client and mark it live for one test. */
function useClient(client) {
  redisService.client = client;
  redisService.isReady = true;
  return client;
}

describe('redisService module integrity', () => {
  it('parses as valid JavaScript', () => {
    // The regression was a SyntaxError, so the cheapest guard is to compile the
    // file. `require` alone would be satisfied by the module cache once another
    // test has loaded it, which is why this reads and compiles the source.
    const source = fs.readFileSync(SERVICE_PATH, 'utf8');

    expect(() => new Function(source)).not.toThrow();
  });

  it('never leaves a statement stranded after a closing brace', () => {
    // `}    if (!this.isReady) return;` is what the bad merge produced: a
    // method body with no signature, glued to the end of the previous method.
    const source = fs.readFileSync(SERVICE_PATH, 'utf8');

    const stranded = source
      .split('\n')
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => /^\s*\}\s+\S/.test(line) && !/^\s*\}\s*(else|catch|finally|while|\)|,|;)/.test(line));

    expect(stranded.map((s) => `${s.number}: ${s.line.trim()}`)).toEqual([]);
  });

  it('exposes the commands its callers use', () => {
    // cacheService, leaderboardService, xpRateLimiter and candidateRankingService
    // between them reach for all of these.
    for (const method of ['get', 'set', 'del', 'incrBy', 'zadd', 'zscore', 'zrevrank', 'zrangeWithScores', 'zcard']) {
      expect(typeof redisService[method], `${method} is missing`).toBe('function');
    }
  });
});

describe('redisService.del', () => {
  let client;

  beforeEach(() => {
    client = useClient(fakeClient());
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    redisService.client = null;
    redisService.isReady = false;
    vi.restoreAllMocks();
  });

  it('deletes every key matching the pattern in one command', async () => {
    client.matching = ['openprep:cache:quiz:a', 'openprep:cache:quiz:b'];

    const removed = await redisService.del('openprep:cache:quiz:*');

    expect(removed).toBe(2);
    expect(client.calls).toEqual([
      ['keys', 'openprep:cache:quiz:*'],
      ['del', ['openprep:cache:quiz:a', 'openprep:cache:quiz:b']],
    ]);
  });

  it('issues no DEL when nothing matches', async () => {
    client.matching = [];

    const removed = await redisService.del('openprep:cache:summary:*');

    expect(removed).toBe(0);
    expect(client.calls.map(([command]) => command)).toEqual(['keys']);
  });

  it('is a no-op while Redis is unavailable', async () => {
    redisService.isReady = false;

    await expect(redisService.del('openprep:cache:*')).resolves.toBe(0);
    expect(client.calls).toEqual([]);
  });

  it('swallows a Redis failure so an invalidation cannot take down the caller', async () => {
    client.keys = async () => {
      throw new Error('READONLY You cannot write against a read only replica');
    };

    await expect(redisService.del('openprep:cache:*')).resolves.toBe(0);
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('redisService counters and guards', () => {
  let client;

  beforeEach(() => {
    client = useClient(fakeClient());
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    redisService.client = null;
    redisService.isReady = false;
    vi.restoreAllMocks();
  });

  it('sets the TTL only when incrBy creates the key', async () => {
    await redisService.incrBy('xp:user:1', 10, 3600);
    await redisService.incrBy('xp:user:1', 5, 3600);

    const expires = client.calls.filter(([command]) => command === 'expire');

    // Two increments, one EXPIRE — a long-lived counter must not have its
    // expiry pushed out by every later increment.
    expect(expires).toEqual([['expire', 'xp:user:1', 3600]]);
  });

  it('returns null from incrBy when Redis is down rather than a count of zero', async () => {
    redisService.isReady = false;

    // A falsy-but-numeric 0 would read as "no quota used" to xpRateLimiter.
    await expect(redisService.incrBy('xp:user:1', 10)).resolves.toBeNull();
  });

  it('round-trips a value through set and get', async () => {
    client.store = {};
    client.set = async function set(key, value) {
      this.calls.push(['set', key, value]);
      this.store[key] = value;
      return 'OK';
    };

    await redisService.set('leaderboard:all:50', { leaderboard: [{ userId: 7 }] }, 300);

    await expect(redisService.get('leaderboard:all:50')).resolves.toEqual({
      leaderboard: [{ userId: 7 }],
    });
  });

  it('returns null from get on unparseable cached data instead of throwing', async () => {
    client.store = { 'broken:key': 'not json' };

    await expect(redisService.get('broken:key')).resolves.toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });
});

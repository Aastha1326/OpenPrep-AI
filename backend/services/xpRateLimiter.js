const redisService = require('./redisService');

/** Maximum XP a single user may earn in any one-hour period. */
const HOURLY_XP_CAP = 500;

/** Length of the rate-limit window. */
const WINDOW_MS = 60 * 60 * 1000;

/** How long a bucket is kept around — two windows, so the previous one survives. */
const BUCKET_TTL_SECONDS = (WINDOW_MS / 1000) * 2;

/**
 * In-process fallback counter, used only when Redis is unavailable.
 *
 * Reads and writes here happen with no await in between, so within one Node
 * process the increment is atomic. Across processes it is not — a multi-replica
 * deployment running without Redis gets one counter per replica. That is a real
 * limitation, and `degraded` is reported on every result so the caller can say
 * so rather than pretending the cap held.
 */
const localBuckets = new Map();
let lastPrune = 0;

const pruneLocalBuckets = (now) => {
  // Pruning on every write would be wasteful; once a window is plenty.
  if (now - lastPrune < WINDOW_MS) return;
  lastPrune = now;
  for (const [key, entry] of localBuckets) {
    if (entry.expiresAt <= now) {
      localBuckets.delete(key);
    }
  }
};

const localIncrBy = (key, amount, now) => {
  pruneLocalBuckets(now);
  const existing = localBuckets.get(key);
  const base = existing && existing.expiresAt > now ? existing.value : 0;
  const value = base + amount;
  localBuckets.set(key, { value, expiresAt: now + BUCKET_TTL_SECONDS * 1000 });
  return value;
};

const localGet = (key, now) => {
  const entry = localBuckets.get(key);
  if (!entry || entry.expiresAt <= now) return 0;
  return entry.value;
};

/** Reset the in-process fallback. Tests only. */
const __resetLocalBuckets = () => {
  localBuckets.clear();
  lastPrune = 0;
};

const bucketIndex = (timestamp) => Math.floor(timestamp / WINDOW_MS);

const bucketKey = (userId, index) => `xp_earned:${userId}:${index}`;

/**
 * Estimate usage over the trailing hour from two fixed buckets.
 *
 * A single fixed bucket resets at the top of the hour, which let a user earn
 * the full cap at 10:59 and the full cap again at 11:00. Weighting the previous
 * bucket by how much of it still falls inside the trailing hour approximates a
 * rolling window without having to store a timestamp per award.
 *
 * @param {number} previousCount XP recorded in the preceding bucket.
 * @param {number} currentCount XP recorded in the current bucket.
 * @param {number} elapsedFraction How far into the current bucket we are, 0-1.
 */
const estimateSlidingUsage = (previousCount, currentCount, elapsedFraction) => {
  const safeFraction = Math.min(1, Math.max(0, elapsedFraction));
  const carriedOver = previousCount * (1 - safeFraction);
  return Math.max(0, Math.round(carriedOver + currentCount));
};

const elapsedFractionOf = (now) => (now % WINDOW_MS) / WINDOW_MS;

/** Synchronous read of the in-process buckets. */
const readLocalBuckets = (userId, now) => {
  const index = bucketIndex(now);
  const currentKey = bucketKey(userId, index);
  return {
    current: localGet(currentKey, now),
    previous: localGet(bucketKey(userId, index - 1), now),
    currentKey,
    degraded: true,
  };
};

const readRedisBuckets = async (userId, now) => {
  const index = bucketIndex(now);
  const currentKey = bucketKey(userId, index);
  const previousKey = bucketKey(userId, index - 1);

  const [current, previous] = await Promise.all([
    redisService.get(currentKey),
    redisService.get(previousKey),
  ]);

  return {
    current: Number(current) || 0,
    previous: Number(previous) || 0,
    currentKey,
    degraded: false,
  };
};

const readBuckets = async (userId, now) =>
  redisService.isReady ? readRedisBuckets(userId, now) : readLocalBuckets(userId, now);

/**
 * Current usage and remaining allowance for a user, without consuming any.
 */
const getUsage = async (userId, now = Date.now()) => {
  const { current, previous, degraded } = await readBuckets(userId, now);
  const usage = estimateSlidingUsage(previous, current, elapsedFractionOf(now));

  return {
    usage,
    remaining: Math.max(0, HOURLY_XP_CAP - usage),
    cap: HOURLY_XP_CAP,
    degraded,
  };
};

/**
 * Claim up to `amount` XP against the user's hourly allowance.
 *
 * Returns how much was actually granted — 0 when the cap is already spent.
 * The counter is incremented before the caller persists the XP; if that write
 * fails the caller should hand the amount back with `refund`, so a user is
 * never charged for XP they did not receive.
 */
const settle = (usage, granted, requested, remaining, degraded) => ({
  granted,
  usage: usage + granted,
  remaining: Math.max(0, remaining - granted),
  capped: granted < requested,
  degraded,
});

/**
 * Claim allowance against the in-process counter.
 *
 * Deliberately synchronous end to end: an await between reading the buckets
 * and incrementing them lets concurrent callers all observe the same usage and
 * all pass, which is the race the Redis path avoids with INCRBY. Node runs this
 * body without interleaving, so the check and the increment cannot be split.
 */
const consumeLocal = (userId, requested, now) => {
  const { current, previous, currentKey } = readLocalBuckets(userId, now);
  const usage = estimateSlidingUsage(previous, current, elapsedFractionOf(now));
  const remaining = Math.max(0, HOURLY_XP_CAP - usage);
  const granted = Math.min(requested, remaining);

  if (granted <= 0) {
    return { granted: 0, usage, remaining: 0, capped: true, degraded: true };
  }

  localIncrBy(currentKey, granted, now);
  return settle(usage, granted, requested, remaining, true);
};

const consume = async (userId, amount, now = Date.now()) => {
  const requested = Math.max(0, Math.floor(Number(amount) || 0));
  if (requested === 0) {
    return { granted: 0, usage: 0, remaining: HOURLY_XP_CAP, capped: false, degraded: false };
  }

  if (!redisService.isReady) {
    return consumeLocal(userId, requested, now);
  }

  const { current, previous, currentKey } = await readRedisBuckets(userId, now);
  const usage = estimateSlidingUsage(previous, current, elapsedFractionOf(now));
  const remaining = Math.max(0, HOURLY_XP_CAP - usage);
  const granted = Math.min(requested, remaining);

  if (granted <= 0) {
    return { granted: 0, usage, remaining: 0, capped: true, degraded: false };
  }

  const total = await redisService.incrBy(currentKey, granted, BUCKET_TTL_SECONDS);
  if (total === null) {
    // Redis dropped out between the read and the increment. Record the award
    // locally rather than letting it through uncounted.
    localIncrBy(currentKey, granted, now);
    return settle(usage, granted, requested, remaining, true);
  }

  return settle(usage, granted, requested, remaining, false);
};

/**
 * Return unspent allowance after a failed award.
 */
const refund = async (userId, amount, now = Date.now()) => {
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (value === 0) return;

  const currentKey = bucketKey(userId, bucketIndex(now));

  if (redisService.isReady) {
    const total = await redisService.incrBy(currentKey, -value, BUCKET_TTL_SECONDS);
    if (total !== null) return;
  }

  localIncrBy(currentKey, -value, now);
};

module.exports = {
  consume,
  refund,
  getUsage,
  estimateSlidingUsage,
  HOURLY_XP_CAP,
  WINDOW_MS,
  __resetLocalBuckets,
};

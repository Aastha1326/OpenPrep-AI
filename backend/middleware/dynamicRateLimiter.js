let redisConfig = null;
try {
  redisConfig = require('../config/redis');
} catch (e) {}

let redisService = null;
try {
  redisService = require('../services/redisService');
} catch (e) {}

let SecurityAuditLog = null;
try {
  const models = require('../models');
  SecurityAuditLog = models.SecurityAuditLog;
} catch (e) {}

// Lua script to atomically evaluate and deduct tokens from the bucket
const LUA_TOKEN_BUCKET = `
  local key = KEYS[1]
  local cost = tonumber(ARGV[1])
  local max_tokens = tonumber(ARGV[2])
  local refill_rate = tonumber(ARGV[3])
  local now = tonumber(ARGV[4])

  -- Retrieve bucket state
  local data = redis.call("HMGET", key, "tokens", "last_updated")
  local tokens = tonumber(data[1])
  local last_updated = tonumber(data[2])

  -- Initialize bucket if empty
  if not tokens then
    tokens = max_tokens
    last_updated = now
  else
    -- Add refilled tokens based on time elapsed (refill_rate is tokens per millisecond)
    local elapsed = now - last_updated
    tokens = math.min(max_tokens, tokens + (elapsed * refill_rate))
  end

  -- Evaluate drop condition
  if tokens >= cost then
    tokens = tokens - cost
    redis.call("HMSET", key, "tokens", tokens, "last_updated", now)
    redis.call("PEXPIRE", key, 60000) -- Clean up idle buckets after 1 minute
    return {1, math.floor(tokens)}
  else
    return {0, math.floor(tokens)}
  end
`;

// In-memory fallback stores for unit testing / offline Redis environment
const localTokenBuckets = new Map(); // key -> { tokens, last_updated }
const localAbuseCounters = new Map(); // key -> { count, expiresAt }

function _resetInMemoryStore() {
  localTokenBuckets.clear();
  localAbuseCounters.clear();
}

async function evalTokenBucket(redisKey, routeCost, maxTokens, refillRatePerMs, now) {
  // 1. Try ioredis client
  if (redisService && redisService.isReady && redisService.client && typeof redisService.client.eval === 'function') {
    try {
      const res = await redisService.client.eval(
        LUA_TOKEN_BUCKET,
        1,
        redisKey,
        routeCost.toString(),
        maxTokens.toString(),
        refillRatePerMs.toString(),
        now.toString()
      );
      if (Array.isArray(res)) return [Number(res[0]), Number(res[1])];
    } catch (err) {}
  }

  // 2. Try node-redis client
  if (redisConfig && typeof redisConfig.eval === 'function') {
    try {
      const res = await redisConfig.eval(LUA_TOKEN_BUCKET, {
        keys: [redisKey],
        arguments: [routeCost.toString(), maxTokens.toString(), refillRatePerMs.toString(), now.toString()],
      });
      if (Array.isArray(res)) return [Number(res[0]), Number(res[1])];
    } catch (err) {}
  }

  // 3. In-memory JavaScript fallback
  let bucket = localTokenBuckets.get(redisKey);
  if (!bucket) {
    bucket = { tokens: maxTokens, last_updated: now };
  } else {
    const elapsed = Math.max(0, now - bucket.last_updated);
    bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillRatePerMs);
  }

  if (bucket.tokens >= routeCost) {
    bucket.tokens -= routeCost;
    bucket.last_updated = now;
    localTokenBuckets.set(redisKey, bucket);
    return [1, Math.floor(bucket.tokens)];
  } else {
    bucket.last_updated = now;
    localTokenBuckets.set(redisKey, bucket);
    return [0, Math.floor(bucket.tokens)];
  }
}

async function incrAbuseViolation(abuseTrackingKey, now) {
  // Try ioredis / redisService
  if (redisService && redisService.isReady && redisService.client) {
    try {
      const count = await redisService.client.incr(abuseTrackingKey);
      if (count === 1) {
        await redisService.client.expire(abuseTrackingKey, 600);
      }
      return count;
    } catch (e) {}
  }

  // Try redisConfig / incrBy
  if (redisConfig && typeof redisConfig.incrBy === 'function') {
    try {
      return await redisConfig.incrBy(abuseTrackingKey, 1, 600);
    } catch (e) {}
  }

  // In-memory fallback
  let record = localAbuseCounters.get(abuseTrackingKey);
  if (!record || record.expiresAt < now) {
    record = { count: 1, expiresAt: now + 600000 };
  } else {
    record.count += 1;
  }
  localAbuseCounters.set(abuseTrackingKey, record);
  return record.count;
}

const dynamicRateLimiter = (options = {}) => {
  const routeCost = options.cost || 1;

  return async (req, res, next) => {
    try {
      // 1. Resolve Identity and Tier Calibration
      const identifier = req.user ? req.user.id : req.ip || '127.0.0.1';
      const role = req.user ? req.user.role : 'unauthenticated';

      if (role === 'admin') return next(); // Admin bypass

      let maxTokens = 60;
      if (role === 'contributor') maxTokens = 120;
      if (role === 'unauthenticated') maxTokens = 30;

      const refillRatePerMs = maxTokens / 60 / 1000;
      const redisKey = `ratelimit:${identifier}`;
      const now = Date.now();

      // 2. Execute Token Bucket Evaluation
      const [allowed, remainingTokens] = await evalTokenBucket(
        redisKey,
        routeCost,
        maxTokens,
        refillRatePerMs,
        now
      );

      // 3. Populate Standard Compliance Headers
      res.setHeader('X-RateLimit-Limit', maxTokens);
      res.setHeader('X-RateLimit-Remaining', remainingTokens);

      if (allowed === 1) {
        return next();
      }

      // 4. Handle Exhaustion, Populate Retry-After, and Trigger Abuse Mitigations
      const retryAfterSeconds = Math.max(1, Math.ceil(routeCost / (refillRatePerMs * 1000)));
      res.setHeader('Retry-After', retryAfterSeconds);

      const abuseTrackingKey = `abuse:${identifier}`;
      const violations = await incrAbuseViolation(abuseTrackingKey, now);

      if (violations >= 3 && SecurityAuditLog && typeof SecurityAuditLog.create === 'function') {
        try {
          await SecurityAuditLog.create({
            userId: req.user ? req.user.id : null,
            ipAddress: req.ip || '127.0.0.1',
            severity: 'CRITICAL',
            eventType: 'API_ABUSE_LIMIT_BREACH',
            event: 'API_ABUSE_LIMIT_BREACH',
            details: `Identifier exceeded dynamic bucket boundaries 3 times within 10 minutes. Route: ${req.originalUrl || req.url}`,
            metadata: {
              route: req.originalUrl || req.url,
              violations,
              cost: routeCost,
            },
          });
        } catch (auditErr) {
          console.error('Failed to record SecurityAuditLog:', auditErr.message);
        }
      }

      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'API resource bucket depleted. Please slow down your rate of ingestion.',
        retryAfter: retryAfterSeconds,
      });
    } catch (error) {
      console.error('Rate Limiter Engine Error:', error);
      return next();
    }
  };
};

dynamicRateLimiter.LUA_TOKEN_BUCKET = LUA_TOKEN_BUCKET;
dynamicRateLimiter._resetInMemoryStore = _resetInMemoryStore;

module.exports = dynamicRateLimiter;

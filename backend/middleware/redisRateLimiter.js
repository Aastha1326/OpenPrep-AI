const redisService = require('../services/redisService');

// In-memory fallback map
const memoryStore = new Map();

// Helper to run in-memory rate limiting when Redis is down
function handleMemoryRateLimit(key, maxTokens, refillRateMs, now) {
  let bucket = memoryStore.get(key);
  if (!bucket) {
    bucket = { tokens: maxTokens, lastRefreshed: now };
  } else {
    const elapsed = now - bucket.lastRefreshed;
    if (elapsed > 0) {
      bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillRateMs);
      bucket.lastRefreshed = now;
    }
  }

  const allowed = bucket.tokens >= 1;
  if (allowed) {
    bucket.tokens -= 1;
  }
  memoryStore.set(key, bucket);

  const retryAfter = allowed ? 0 : Math.ceil((1 - bucket.tokens) / (refillRateMs * 1000));
  return {
    allowed,
    remaining: Math.floor(bucket.tokens),
    retryAfter,
  };
}

// Factory to create rate limiting middlewares
function createRateLimiter({ max, windowMs, prefix, message }) {
  const refillRateMs = max / windowMs;

  return async (req, res, next) => {
    // Skip rate limiting in test mode unless forced for unit testing
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const identifier = req.user && req.user.id ? req.user.id : (req.ip || req.connection.remoteAddress || '127.0.0.1');
    const key = `ratelimit:${prefix}:${identifier}`;
    const now = Date.now();

    let allowed = false;
    let remaining = 0;
    let retryAfter = 0;

    try {
      if (redisService.isReady && redisService.client) {
        const client = redisService.client;
        
        // Define command dynamically on client if not already defined
        if (!client.tokenBucket) {
          client.defineCommand('tokenBucket', {
            numberOfKeys: 1,
            lua: `
              local key = KEYS[1]
              local max_tokens = tonumber(ARGV[1])
              local refill_rate = tonumber(ARGV[2])
              local now = tonumber(ARGV[3])
              local cost = 1

              local bucket = redis.call('HMGET', key, 'tokens', 'lastRefreshed')
              local tokens = tonumber(bucket[1])
              local lastRefreshed = tonumber(bucket[2])

              if not tokens then
                  tokens = max_tokens
                  lastRefreshed = now
              else
                  local elapsed = now - lastRefreshed
                  if elapsed > 0 then
                      tokens = math.min(max_tokens, tokens + (elapsed * refill_rate))
                      lastRefreshed = now
                  end
              end

              local allowed = false
              if tokens >= cost then
                  tokens = tokens - cost
                  allowed = true
              end

              redis.call('HMSET', key, 'tokens', tokens, 'lastRefreshed', lastRefreshed)
              redis.call('EXPIRE', key, 300)

              local retry_after = 0
              if not allowed then
                  retry_after = math.ceil((cost - tokens) / (refill_rate * 1000))
              end

              return {allowed and 1 or 0, math.floor(tokens), retry_after}
            `
          });
        }

        const result = await client.tokenBucket(key, max, refillRateMs, now);
        allowed = result[0] === 1;
        remaining = result[1];
        retryAfter = result[2];
      } else {
        // Fallback to in-memory store
        const result = handleMemoryRateLimit(key, max, refillRateMs, now);
        allowed = result.allowed;
        remaining = result.remaining;
        retryAfter = result.retryAfter;
      }
    } catch (err) {
      console.warn('Rate limiter check error, falling back to bypass:', err.message);
      return next();
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));

    if (!allowed) {
      res.setHeader('Retry-After', retryAfter || 1);
      return res.status(429).json({
        success: false,
        error: message || 'Too many requests. Please try again later.',
        retryInSeconds: retryAfter || Math.ceil(windowMs / 1000) || 900,
        remainingQuota: 0,
      });
    }

    next();
  };
}

const authRateLimiter = createRateLimiter({
  max: 5,
  windowMs: 60 * 1000,
  prefix: 'auth',
  message: 'Too many login attempts. Please try again in a minute.',
});

const aiRateLimiter = createRateLimiter({
  max: 10,
  windowMs: 15 * 60 * 1000,
  prefix: 'ai',
  message: 'AI rate limit exceeded',
});

const standardGetRateLimiter = createRateLimiter({
  max: 100,
  windowMs: 60 * 1000,
  prefix: 'get',
  message: 'Too many requests. Please try again later.',
});

module.exports = {
  authRateLimiter,
  aiRateLimiter,
  standardGetRateLimiter,
};

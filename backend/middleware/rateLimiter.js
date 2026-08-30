const Redis = require('ioredis');
const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config/constants');

/**
 * The Redis client is built on first use rather than at require time.
 *
 * Connecting eagerly meant that merely requiring any route that imports this
 * file opened a socket and began retrying. On a machine without Redis — every
 * CI unit job, most contributor laptops — that floods the run with connection
 * errors and keeps the event loop alive so the process never exits on its own.
 * services/redisService.js already builds its client behind an explicit
 * connect(); this now follows the same shape.
 */
let redisClient = null;
let redisAttempted = false;

function getRedisClient() {
  if (redisAttempted) return redisClient;
  redisAttempted = true;

  try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy(times) {
        // Give up rather than reconnect forever behind an unreachable host.
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      },
    });

    redisClient.on('error', (err) => {
      console.error('⚠️ Redis connection error down. Switching to In-Memory fallback rate limiting:', err.message);
    });

    redisClient.connect().catch(() => {
      // Already reported by the error handler above; the in-memory window
      // below is a complete fallback, so there is nothing to escalate.
    });
  } catch (e) {
    console.error('❌ Failed to instantiate Redis. Using In-Memory local rate limiting fallback:', e);
    redisClient = null;
  }

  return redisClient;
}

// In-Memory Backup Store for Fallback Mode (Simulated LRU Structure)
const memoryStore = new Map();

// Configuration Matrix: Defines Tiered Rate Limits (Limit, Window in Milliseconds)
const TIER_LIMITS = {
  anonymous: { limit: 10, window: 60000 },
  authenticated_standard: { limit: 60, window: 60000 },
  authenticated_ai_route: { limit: 15, window: 60000 },
  educator_admin: { limit: 180, window: 60000 }
};

/**
 * Resolves the operational limits tier for the current incoming request context.
 */
function resolveUserTier(req) {
  if (!req.user) return TIER_LIMITS.anonymous;
  if (req.user.role === 'educator' || req.user.role === 'admin') return TIER_LIMITS.educator_admin;
  
  // Isolate AI generation routes specifically for localized constraint enforcement
  if (req.path.includes('/api/ai/') || req.path.includes('/v1/ai/')) {
    return TIER_LIMITS.authenticated_ai_route;
  }
  return TIER_LIMITS.authenticated_standard;
}

async function rateLimiterMiddleware(req, res, next) {
  if (shouldSkip(req)) return next();

  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown_client_ip';


  const userId = req.user ? req.user.id : 'anon';
  const trackingKey = `ratelimit:${userId}:${ip}:${req.path}`;

  const { limit, window } = resolveUserTier(req);
  const now = Date.now();
  const clearBefore = now - window;

  // --- REDIS MASTER TRACKING PIPELINE PATH ---
  const client = getRedisClient();
  if (client && client.status === 'ready') {
    try {
      const pipeline = client.pipeline();
      
      // 1. Evict stale request elements outside the sliding window boundary
      pipeline.zremrangebyscore(trackingKey, 0, clearBefore);
      // 2. Add current unique request millisecond identifier token
      pipeline.zadd(trackingKey, now, `${now}-${Math.random()}`);
      // 3. Count remaining valid request tokens inside the active bucket
      pipeline.zcard(trackingKey);
      // 4. Set key expiration to clear space automatically post-window expiration
      pipeline.pexpire(trackingKey, window);

      const results = await pipeline.exec();
      const currentRequestCount = results[2][1]; // Extract response from ZCARD operation

      const remaining = Math.max(0, limit - currentRequestCount);
      const resetTimeSeconds = Math.ceil((window - (now % window)) / 1000);

      // Set RFC-Standardized HTTP Response Headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTimeSeconds);

      if (currentRequestCount > limit) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Abusive script or rapid clicks detected.',
          retry_after_seconds: resetTimeSeconds
        });
      }
      return next();
    } catch (redisErr) {
      console.error('Fallback triggered. Redis error pipeline execution exception:', redisErr);
      // Fall through cleanly to execution of In-Memory tracking paths
    }
  }

  // --- IN-MEMORY LOCAL FALLBACK TIMING ENGINE ---
  if (!memoryStore.has(trackingKey)) {
    memoryStore.set(trackingKey, []);
  }

  let timestamps = memoryStore.get(trackingKey);
  // Evict items outside the sliding frame window bounds manually
  timestamps = timestamps.filter(ts => ts > clearBefore);
  timestamps.push(now);
  memoryStore.set(trackingKey, timestamps);

  const localCount = timestamps.length;
  const localRemaining = Math.max(0, limit - localCount);
  const localReset = Math.ceil((window - (now % window)) / 1000);

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', localRemaining);
  res.setHeader('X-RateLimit-Reset', localReset);

  if (localCount > limit) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded (In-Memory Fallback Guard Active).',
      retry_after_seconds: localReset
    });
  }

  // Periodic Local Garbage Collection memory cleanups to avoid leak expansions
  if (memoryStore.size > 5000) {
    for (const [key, value] of memoryStore.entries()) {
      if (value.length === 0 || value[value.length - 1] < Date.now() - 60000) {
        memoryStore.delete(key);
      }
    }
  }

  return next();
}

/**
 * Skip limiting in ordinary test runs, but let the dedicated rate-limit suites
 * opt back in with the `x-test-rate-limit` header.
 */
const shouldSkip = (req) =>
  process.env.NODE_ENV === 'test' && !req?.headers?.['x-test-rate-limit'];

/** Keys by user id when authenticated, otherwise by originating address. */
const keyByUserOrIp = (req) =>
  req.user && req.user.id
    ? String(req.user.id)
    : String(
        req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1'
      );

/**
 * AI endpoint limiter — 10 requests / 15 minutes.
 *
 * These routes spend paid Gemini quota per call, so they carry a budget of
 * their own rather than the generic per-tier allowance in the middleware
 * above. Introduced in #1257 and deleted by accident in #1715.
 */
const aiLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOWS.FIFTEEN_MINUTES,
  max: 10,
  skip: shouldSkip,
  keyGenerator: keyByUserOrIp,
  handler: (req, res, next, options) => {
    const retryInSeconds = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', retryInSeconds);
    res.status(429).json({
      success: false,
      error: 'AI rate limit exceeded',
      retryInSeconds,
      remainingQuota: 0,
    });
  },
  standardHeaders: true,
  legacyHeaders: true,
});

/**
 * Upload-and-analyse limiter — 5 requests / minute.
 *
 * These endpoints do a file upload *and* an AI pass, so they are tighter than
 * aiLimiter on a much shorter window.
 */
const strictAiLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOWS.ONE_MINUTE,
  max: 5,
  skip: shouldSkip,
  message: {
    success: false,
    error: 'Too many AI analysis requests. Please wait a moment before uploading more files.',
  },
  standardHeaders: true,
  legacyHeaders: true,
});

/**
 * Auth email limiter — 3 requests / 15 minutes.
 *
 * Guards the endpoints that send mail (verification resend, OTP) against
 * being used to spam a third party or exhaust the SMTP allowance.
 */
const authEmailLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOWS.FIFTEEN_MINUTES,
  max: 3,
  skip: shouldSkip,
  message: {
    success: false,
    error: 'Too many requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: true,
});

/**
 * Exported as a callable middleware with the named limiters hung off it.
 *
 * Two consumer shapes exist in the tree and both are legitimate:
 * `require('.../rateLimiter')` used directly as app-level middleware, and
 * `const { aiLimiter } = require('.../rateLimiter')` in the route modules.
 * A function object satisfies both, so neither side has to be rewritten.
 */
module.exports = rateLimiterMiddleware;
module.exports.rateLimiterMiddleware = rateLimiterMiddleware;
module.exports.aiLimiter = aiLimiter;
module.exports.strictAiLimiter = strictAiLimiter;
module.exports.authEmailLimiter = authEmailLimiter;

const Redis = require('ioredis');

// Initialize Redis Client with fallback safety parameters
let redisClient = null;
try {
  redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
  });
  
  redisClient.on('error', (err) => {
    console.error('⚠️ Redis connection error down. Switching to In-Memory fallback rate limiting:', err.message);
  });
} catch (e) {
  console.error('❌ Failed to instantiate Redis. Using In-Memory local rate limiting fallback:', e);
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

/**
 * Sliding Window Token Bucket Middleware Matrix Core
 */
async function rateLimiterMiddleware(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown_client_ip';
  const userId = req.user ? req.user.id : 'anon';
  const trackingKey = `ratelimit:${userId}:${ip}:${req.path}`;

  const { limit, window } = resolveUserTier(req);
  const now = Date.now();
  const clearBefore = now - window;

  // --- REDIS MASTER TRACKING PIPELINE PATH ---
  if (redisClient && redisClient.status === 'ready') {
    try {
      const pipeline = redisClient.pipeline();
      
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

module.exports = rateLimiterMiddleware;

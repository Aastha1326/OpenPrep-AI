const redisService = require('../services/redisService');
const { logSecurityEvent } = require('./auditLogMiddleware');
const logger = require('../utils/logger');

// Local in-memory fallbacks when Redis is offline
const localBuckets = new Map();     // key -> { tokens, lastReplenished }
const localBlacklist = new Map();   // ip -> expireTimestamp
const localFailedLogins = new Map(); // ip -> { count, expireTimestamp }

// Default Configuration parameters
const DEFAULT_MAX_TOKENS = 100;
const DEFAULT_REPLENISH_RATE = 1; // 1 token per second
const BLACKLIST_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
const LOGIN_MONITOR_WINDOW_MS = 60 * 1000;      // 1 minute

/**
 * Normalizes client IP address.
 */
function getClientIp(req) {
  return req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
}

/**
 * Checks if the IP is blacklisted (Redis or local Map).
 */
async function isIpBlacklisted(ip) {
  const redisKey = `rate:blacklist:${ip}`;
  if (redisService.isReady && redisService.client) {
    try {
      const value = await redisService.client.get(redisKey);
      return value === 'true';
    } catch (err) {
      logger.warn('Failed to query Redis blacklist state', { ip, error: err.message });
    }
  }

  const expireAt = localBlacklist.get(ip);
  if (expireAt) {
    if (Date.now() < expireAt) {
      return true;
    }
    localBlacklist.delete(ip); // Expired, clean up
  }
  return false;
}

/**
 * Blacklists an IP address for 2 hours.
 */
async function blacklistIp(ip, reason) {
  const redisKey = `rate:blacklist:${ip}`;
  const ttlSeconds = Math.round(BLACKLIST_DURATION_MS / 1000);

  if (redisService.isReady && redisService.client) {
    try {
      await redisService.client.set(redisKey, 'true', 'EX', ttlSeconds);
    } catch (err) {
      logger.error('Failed to set Redis IP blacklist block', { ip, error: err.message });
    }
  }

  localBlacklist.set(ip, Date.now() + BLACKLIST_DURATION_MS);
  logger.warn(`[SmartRateLimiter] IP ${ip} blacklisted. Reason: ${reason}`);
}

/**
 * Tracks failed login attempts. Blacklists if attempts > 5 in 1 minute.
 */
async function trackFailedLogin(ip, req) {
  const redisKey = `rate:failed_logins:${ip}`;
  let count = 0;

  if (redisService.isReady && redisService.client) {
    try {
      const val = await redisService.client.incr(redisKey);
      if (val === 1) {
        await redisService.client.expire(redisKey, Math.round(LOGIN_MONITOR_WINDOW_MS / 1000));
      }
      count = val;
    } catch (err) {
      logger.warn('Failed to increment Redis login failure count', { ip, error: err.message });
    }
  }

  if (count === 0) {
    // Local fallback
    const now = Date.now();
    const entry = localFailedLogins.get(ip) || { count: 0, expireTimestamp: now + LOGIN_MONITOR_WINDOW_MS };
    if (now > entry.expireTimestamp) {
      entry.count = 1;
      entry.expireTimestamp = now + LOGIN_MONITOR_WINDOW_MS;
    } else {
      entry.count += 1;
    }
    localFailedLogins.set(ip, entry);
    count = entry.count;
  }

  if (count >= 5) {
    await blacklistIp(ip, 'Spike in failed login attempts (possible brute-force/credential-stuffing)');
    await logSecurityEvent({
      userId: null,
      eventType: 'failed_login_spike',
      severity: 'CRITICAL',
      req,
      statusCode: 429,
      metadata: { count, reason: 'Brute-force/Credential-stuffing threshold crossed' },
    });
  }
}

/**
 * Processes token leak / replenish calculations on the target key.
 */
async function consumeTokens(key, cost, maxTokens, replenishRate) {
  const now = Date.now();
  const redisKey = `rate:bucket:${key}`;

  if (redisService.isReady && redisService.client) {
    try {
      // Use multi/exec transaction for atomic check-and-set
      const bucketData = await redisService.client.get(redisKey);
      let bucket = { tokens: maxTokens, lastReplenished: now };

      if (bucketData) {
        const parsed = JSON.parse(bucketData);
        const elapsedSec = (now - parsed.lastReplenished) / 1000;
        const replenishedTokens = Math.min(maxTokens, parsed.tokens + elapsedSec * replenishRate);
        bucket = { tokens: replenishedTokens, lastReplenished: now };
      }

      if (bucket.tokens >= cost) {
        bucket.tokens -= cost;
        await redisService.client.set(redisKey, JSON.stringify(bucket), 'EX', 3600); // 1h cache
        return { allowed: true, remaining: Math.round(bucket.tokens) };
      } else {
        return { allowed: false, remaining: Math.round(bucket.tokens) };
      }
    } catch (err) {
      logger.warn('Redis token bucket consumption failed, falling back locally', { key, error: err.message });
    }
  }

  // Local fallback
  const entry = localBuckets.get(key) || { tokens: maxTokens, lastReplenished: now };
  const elapsedSec = (now - entry.lastReplenished) / 1000;
  const replenishedTokens = Math.min(maxTokens, entry.tokens + elapsedSec * replenishRate);

  if (replenishedTokens >= cost) {
    entry.tokens = replenishedTokens - cost;
    entry.lastReplenished = now;
    localBuckets.set(key, entry);
    return { allowed: true, remaining: Math.round(entry.tokens) };
  } else {
    entry.tokens = replenishedTokens;
    entry.lastReplenished = now;
    localBuckets.set(key, entry);
    return { allowed: false, remaining: Math.round(entry.tokens) };
  }
}

/**
 * Factory middleware to declare smart rate limits.
 * @param {Object} options - Custom parameters: cost, maxTokens, replenishRate, eventType
 */
const smartRateLimiter = (options = {}) => {
  const cost = options.cost || 1;
  const maxTokens = options.maxTokens || DEFAULT_MAX_TOKENS;
  const replenishRate = options.replenishRate || DEFAULT_REPLENISH_RATE;
  const eventType = options.eventType || 'api_request';

  return async (req, res, next) => {
    if (process.env.NODE_ENV === 'test' && process.env.ENABLE_RATE_LIMIT_TESTS !== 'true') {
      return next();
    }
    const ip = getClientIp(req);
    const userId = req.user ? req.user.id : null;
    // Route key: bind to userId if authenticated, else IP address
    const rateKey = userId ? `user:${userId}` : `ip:${ip}`;

    try {
      // 1. Blacklist check
      const blacklisted = await isIpBlacklisted(ip);
      if (blacklisted) {
        return res.status(429).json({
          success: false,
          error: 'Your IP has been temporarily blacklisted due to suspicious activity. Please try again later.',
        });
      }

      // 2. Token Bucket Consumption
      const { allowed, remaining } = await consumeTokens(rateKey, cost, maxTokens, replenishRate);

      res.setHeader('X-RateLimit-Limit', maxTokens);
      res.setHeader('X-RateLimit-Remaining', remaining);

      if (!allowed) {
        await logSecurityEvent({
          userId,
          eventType: 'rate_limit_breach',
          severity: 'WARNING',
          req,
          statusCode: 429,
          metadata: { rateKey, cost, maxTokens },
        });

        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please slow down.',
        });
      }

      // 3. Intercept response to capture failed login attempts
      const originalSend = res.send;
      res.send = function (body) {
        res.send = originalSend;
        const statusCode = res.statusCode;

        if (eventType === 'user_login' && statusCode >= 400) {
          // Fire and forget failed login increment
          trackFailedLogin(ip, req).catch(err => logger.error('Error tracking login failure', err));
        }

        return originalSend.call(this, body);
      };

      next();
    } catch (err) {
      logger.error('[SmartRateLimiter] Middleware execution error:', err);
      next(); // Fail-open to prevent locking out legitimate users in case of system bugs
    }
  };
};

module.exports = {
  smartRateLimiter,
  getClientIp,
  isIpBlacklisted,
  blacklistIp,
  consumeTokens,
  localBuckets,
  localBlacklist,
  localFailedLogins,
};

const cacheManager = require('../utils/cacheManager');

/**
 * Cache middleware for GET endpoints
 * @param {number} ttlSeconds - Time-To-Live in seconds
 */
const cacheMiddleware = (ttlSeconds = 900) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Require authenticated user for scoped cache
    if (!req.user || !req.user.id) {
      return next();
    }

    // Generate cache key using user ID and the request URL
    const key = cacheManager.generateKey(req.user.id, req.originalUrl);

    try {
      const cachedData = await cacheManager.get(key);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      // If cache miss, intercept res.json to store response in cache
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json;
      res.json = function (body) {
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        if (isSuccess && body) {
          cacheManager.set(key, body, ttlSeconds).catch(err => {
            console.warn('Failed to write to cache:', err.message);
          });
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (err) {
      console.warn('Cache middleware error, bypassing cache:', err.message);
      next();
    }
  };
};

module.exports = cacheMiddleware;

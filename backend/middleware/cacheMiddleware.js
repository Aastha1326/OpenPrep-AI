const crypto = require('crypto');
const cacheService = require('../services/cacheService');

/**
 * Cache middleware for GET endpoints
 * @param {number} ttlSeconds - Time-To-Live in seconds
 */
const cacheMiddleware = (ttlOrKeyGenerator = 900, maybeTtlSeconds = 900) => {
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
    const customKey = typeof ttlOrKeyGenerator === 'function'
      ? ttlOrKeyGenerator(req)
      : typeof ttlOrKeyGenerator === 'string' ? ttlOrKeyGenerator : null;
    const routeKey = customKey || (typeof req.originalUrl === 'string' ? req.originalUrl : req.url);
    const ttlSeconds = typeof ttlOrKeyGenerator === 'number' ? ttlOrKeyGenerator : maybeTtlSeconds;
    const key = `openprep:cache:route:${req.user.id}:${routeKey}`;

    const sendCached = (body) => {
      const etag = `W/"${crypto.createHash('sha1').update(JSON.stringify(body)).digest('hex')}"`;
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
      if (req.headers['if-none-match'] === etag) return res.status(304).end();
      return res.json(body);
    };

    try {
      const cachedData = await cacheService.get(key);
      if (cachedData !== null && cachedData !== undefined) {
        res.setHeader('X-Cache', 'HIT');
        return sendCached(cachedData);
      }

      // If cache miss, intercept res.json to store response in cache
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json;
      res.json = function (body) {
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        if (isSuccess && body) {
          cacheService.set(key, body, ttlSeconds).catch(err => {
            console.warn('Failed to write to cache:', err.message);
          });
          const etag = `W/"${crypto.createHash('sha1').update(JSON.stringify(body)).digest('hex')}"`;
          res.setHeader('ETag', etag);
          res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
          if (req.headers['if-none-match'] === etag) return res.status(304).end();
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

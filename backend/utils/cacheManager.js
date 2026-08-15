const { getCache, setCache, invalidateCache } = require('../config/redis');

/**
 * Generate cache key for a user and endpoint/resource
 * @param {string} userId - ID of the authenticated user
 * @param {string} endpoint - The endpoint identifier (e.g. 'stats', 'topics')
 * @returns {string} The scoped cache key
 */
function generateKey(userId, endpoint) {
  if (!userId) {
    throw new Error('userId is required for cache key generation');
  }
  return `user_${userId}:${endpoint}`;
}

async function get(key) {
  return await getCache(key);
}

async function set(key, value, ttlSeconds) {
  return await setCache(key, value, ttlSeconds);
}

async function invalidate(pattern) {
  return await invalidateCache(pattern);
}

module.exports = {
  generateKey,
  get,
  set,
  invalidate,
};

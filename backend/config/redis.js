const redisService = require('../services/redisService');

async function getCache(key) {
  return await redisService.get(key);
}

async function setCache(key, value, ttlSeconds = 86400) {
  return await redisService.set(key, value, ttlSeconds);
}

async function invalidateCache(pattern) {
  return await redisService.del(pattern);
}

module.exports = { getCache, setCache, invalidateCache };

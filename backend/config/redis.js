let createClient;
let redisClient = null;
let isRedisConnected = false;

try {
  createClient = require('redis').createClient;
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
    },
  });

  redisClient.on('error', (err) => {
    console.warn('⚠️ Redis Client Error (Graceful fallback to DB active):', err.message);
  });

  async function connectRedis() {
    try {
      await redisClient.connect();
      isRedisConnected = true;
      console.log('✅ Connected to Redis successfully');
    } catch (err) {
      isRedisConnected = false;
      console.warn('⚠️ Redis connection failed. System will degrade gracefully using database reads.');
    }
  }

  connectRedis();
} catch (err) {
  isRedisConnected = false;
}

async function getCache(key) {
  return await redisService.get(key);
}

async function setCache(key, value, ttlSeconds = 86400) {
  return await redisService.set(key, value, ttlSeconds);
}

async function invalidateCache(pattern) {
  return await redisService.del(pattern);
}

module.exports = { getCache, setCache, invalidateCache, isRedisConnected: () => isRedisConnected };

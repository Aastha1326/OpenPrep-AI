const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
  },
});

redisClient.on('error', (err) => {
  console.warn('⚠️ Redis Client Error (Graceful fallback to DB active):', err.message);
});

let isRedisConnected = false;

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

async function getCache(key) {
  if (!isRedisConnected) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 86400) {
  if (!isRedisConnected) return;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    // Ignore cache write errors
  }
}

async function invalidateCache(pattern) {
  if (!isRedisConnected) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    // Ignore cache invalidation errors
  }
}

module.exports = { getCache, setCache, invalidateCache };

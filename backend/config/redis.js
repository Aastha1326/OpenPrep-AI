const Redis = require('ioredis');
const NodeCache = require('node-cache');

const cacheEnabled = process.env.CACHE_ENABLED !== 'false';
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Setup local fallback cache
const localCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

let redisClient = null;
let isRedisConnected = false;

if (cacheEnabled) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('⚠️ Redis is unreachable. Falling back to in-memory cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
    });

    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis Client Error (Graceful fallback to in-memory active):', err.message);
      isRedisConnected = false;
    });

    redisClient.on('ready', () => {
      console.log('✅ Connected to Redis successfully');
      isRedisConnected = true;
    });
  } catch (err) {
    console.warn('⚠️ Redis connection failed. System will fallback to in-memory cache.');
  }
}

async function getCache(key) {
  if (!cacheEnabled) return null;
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn('Redis Get Error:', err.message);
    }
  }
  // Fallback to local cache
  try {
    const data = localCache.get(key);
    return data !== undefined ? data : null;
  } catch (err) {
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 300) {
  if (!cacheEnabled) return;
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    } catch (err) {
      console.warn('Redis Set Error:', err.message);
    }
  }
  // Fallback to local cache
  try {
    localCache.set(key, value, ttlSeconds);
  } catch (err) {
    // Ignore
  }
}

async function invalidateCache(pattern) {
  if (!cacheEnabled) return;
  if (isRedisConnected && redisClient) {
    try {
      // For ioredis, key wildcard delete
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return;
    } catch (err) {
      console.warn('Redis Invalidate Error:', err.message);
    }
  }
  // Fallback to local cache invalidation
  try {
    // pattern can be something like 'user_123:*'
    // Convert glob pattern to regex
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    const keys = localCache.keys();
    const matchingKeys = keys.filter(key => regexPattern.test(key));
    if (matchingKeys.length > 0) {
      localCache.del(matchingKeys);
    }
  } catch (err) {
    // Ignore
  }
}

module.exports = { getCache, setCache, invalidateCache, isRedisConnected: () => isRedisConnected };

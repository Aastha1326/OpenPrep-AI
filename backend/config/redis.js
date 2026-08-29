let createClient;
let redisClient = null;
let isRedisConnected = false;
let redisService = null;

try {
  redisService = require('../services/redisService');
} catch (err) {
  // Graceful fallback if ioredis module missing in environment
}

// In-memory fallback sorted set store for offline / test environments
const inMemorySortedSets = new Map();

if (process.env.REDIS_URL || process.env.NODE_ENV === 'production') {
  try {
    createClient = require('redis').createClient;
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
      },
    });

    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis Client Error (Graceful fallback active):', err.message);
      isRedisConnected = false;
    });

    async function connectRedis() {
      try {
        await redisClient.connect();
        isRedisConnected = true;
        console.log('✅ Connected to Redis successfully');
      } catch (err) {
        isRedisConnected = false;
      }
    }

    connectRedis();
  } catch (err) {
    isRedisConnected = false;
  }
}

async function getCache(key) {
  if (redisService) return await redisService.get(key);
  return null;
}

async function setCache(key, value, ttlSeconds = 86400) {
  if (redisService) return await redisService.set(key, value, ttlSeconds);
}

async function invalidateCache(pattern) {
  if (redisService) return await redisService.del(pattern);
}

// Sorted Set operations supporting node-redis, ioredis, and in-memory fallback
async function zAdd(key, options) {
  let score, value;
  if (options && typeof options === 'object' && 'score' in options && 'value' in options) {
    score = options.score;
    value = options.value;
  } else if (arguments.length >= 3) {
    score = arguments[1];
    value = arguments[2];
  }

  // 1. Try node-redis client if connected
  if (redisClient && isRedisConnected && typeof redisClient.zAdd === 'function') {
    try {
      return await redisClient.zAdd(key, { score, value });
    } catch (e) {
      console.warn('zAdd node-redis failed:', e.message);
    }
  }

  // 2. Try redisService (ioredis) client
  if (redisService) {
    try {
      const ioredis = redisService.connect();
      if (redisService.isReady && ioredis && typeof ioredis.zadd === 'function') {
        return await ioredis.zadd(key, score, value);
      }
    } catch (e) {
      console.warn('zAdd ioredis failed:', e.message);
    }
  }

  // 3. In-memory fallback
  if (!inMemorySortedSets.has(key)) {
    inMemorySortedSets.set(key, []);
  }
  const set = inMemorySortedSets.get(key);
  const existingIdx = set.findIndex((item) => item.value === value);
  if (existingIdx !== -1) {
    set[existingIdx].score = score;
  } else {
    set.push({ score: Number(score), value: String(value) });
  }
  set.sort((a, b) => a.score - b.score);
  return 1;
}

async function zRem(key, value) {
  // 1. Try node-redis client if connected
  if (redisClient && isRedisConnected && typeof redisClient.zRem === 'function') {
    try {
      return await redisClient.zRem(key, value);
    } catch (e) {
      console.warn('zRem node-redis failed:', e.message);
    }
  }

  // 2. Try redisService (ioredis) client
  if (redisService) {
    try {
      const ioredis = redisService.connect();
      if (redisService.isReady && ioredis && typeof ioredis.zrem === 'function') {
        return await ioredis.zrem(key, value);
      }
    } catch (e) {
      console.warn('zRem ioredis failed:', e.message);
    }
  }

  // 3. In-memory fallback
  if (inMemorySortedSets.has(key)) {
    const set = inMemorySortedSets.get(key);
    const initialLen = set.length;
    const filtered = set.filter((item) => item.value !== String(value));
    inMemorySortedSets.set(key, filtered);
    return initialLen - filtered.length;
  }
  return 0;
}

async function zRangeWithScores(key, min = 0, max = -1) {
  // 1. Try node-redis client if connected
  if (redisClient && isRedisConnected && typeof redisClient.zRangeWithScores === 'function') {
    try {
      return await redisClient.zRangeWithScores(key, min, max);
    } catch (e) {
      console.warn('zRangeWithScores node-redis failed:', e.message);
    }
  }

  // 2. Try redisService (ioredis) client
  if (redisService) {
    try {
      const ioredis = redisService.connect();
      if (redisService.isReady && ioredis && typeof ioredis.zrange === 'function') {
        const raw = await ioredis.zrange(key, min, max, 'WITHSCORES');
        const result = [];
        for (let i = 0; i < raw.length; i += 2) {
          result.push({ value: raw[i], score: Number(raw[i + 1]) });
        }
        return result;
      }
    } catch (e) {
      console.warn('zRangeWithScores ioredis failed:', e.message);
    }
  }

  // 3. In-memory fallback
  if (inMemorySortedSets.has(key)) {
    const set = [...inMemorySortedSets.get(key)];
    set.sort((a, b) => a.score - b.score);
    if (max === -1) {
      return set.slice(min);
    }
    return set.slice(min, max + 1);
  }
  return [];
}

// Reset memory helper for tests
function _resetInMemoryStore() {
  inMemorySortedSets.clear();
}

module.exports = {
  getCache,
  setCache,
  invalidateCache,
  zAdd,
  zRem,
  zRangeWithScores,
  _resetInMemoryStore,
  isRedisConnected: () => isRedisConnected,
};

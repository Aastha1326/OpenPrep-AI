const NodeCache = require('node-cache');
const redisService = require('./redisService');
const crypto = require('crypto');

const DEFAULT_TTL_SECONDS = parseInt(process.env.CACHE_TTL, 10) || 3600;
const QUIZ_TTL_SECONDS = 86400; // 24 hours
const SUMMARY_TTL_SECONDS = 604800; // 7 days
const MAX_KEYS = parseInt(process.env.CACHE_MAX_KEYS, 10) || 1000;

const localCache = new NodeCache({
  stdTTL: DEFAULT_TTL_SECONDS,
  checkperiod: Math.max(60, Math.floor(DEFAULT_TTL_SECONDS / 2)),
  maxKeys: MAX_KEYS,
  useClones: true,
});

const escapePattern = (pattern) =>
  pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');

class CacheService {
  constructor() {
    this.QUIZ_TTL = QUIZ_TTL_SECONDS;
    this.SUMMARY_TTL = SUMMARY_TTL_SECONDS;
    this.DEFAULT_TTL = DEFAULT_TTL_SECONDS;
  }

  /**
   * Deterministically hash payload using SHA-256 with openprep:cache prefix
   * @param {string} prefix - Key namespace (e.g. 'quiz', 'summary')
   * @param {Object|string} payload - Payload to hash
   * @returns {string} Redis key
   */
  hashPayload(prefix, payload) {
    const canonicalStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hash = crypto.createHash('sha256').update(canonicalStr).digest('hex');
    return `openprep:cache:${prefix}:${hash}`;
  }

  async get(key) {
    const meta = await this.getWithMetadata(key);
    return meta.data;
  }

  async getWithMetadata(key) {
    if (redisService.isReady) {
      try {
        const data = await redisService.get(key);
        if (data !== null) {
          return { data, isHit: true, source: 'redis' };
        }
      } catch (err) {
        console.warn('Redis read error, falling back to in-memory cache:', err.message);
      }
    }
    const localData = localCache.get(key);
    if (localData !== undefined && localData !== null) {
      return { data: localData, isHit: true, source: 'memory' };
    }
    return { data: null, isHit: false, source: null };
  }

  async set(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
    if (redisService.isReady) {
      try {
        await redisService.set(key, value, ttlSeconds);
        return;
      } catch (err) {
        console.warn('Redis set error, falling back to in-memory cache:', err.message);
      }
    }
    localCache.set(key, value, ttlSeconds);
  }

  async del(patterns) {
    if (!patterns) return;
    const patternList = Array.isArray(patterns) ? patterns : [patterns];

    if (redisService.isReady) {
      try {
        await Promise.all(patternList.map((pattern) => redisService.del(pattern)));
      } catch (err) {
        console.warn('Redis del error:', err.message);
      }
    }

    const keys = localCache.keys();
    for (const pattern of patternList) {
      const regex = new RegExp(`^${escapePattern(pattern)}$`);
      const matched = keys.filter((key) => regex.test(key));
      if (matched.length > 0) {
        localCache.del(matched);
      }
    }
  }
}

module.exports = new CacheService();

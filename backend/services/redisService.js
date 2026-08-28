const Redis = require('ioredis');

class RedisService {
  constructor() {
    this.client = null;
    this.isReady = false;
  }

  connect() {
    if (this.client) return this.client;

    const redisSentinelService = require('./redisSentinelService');
    this.client = redisSentinelService.connect();

    this.client.on('error', () => {
      this.isReady = false;
    });

    this.client.on('ready', () => {
      this.isReady = true;
    });

    this.isReady = redisSentinelService.isReady;
    return this.client;
  }

  async get(key) {
    if (!this.isReady) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Redis Get Error:', error.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    if (!this.isReady) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      console.warn('Redis Set Error:', error.message);
    }
  }

  /**
   * Atomically add `amount` to a counter and return the new total.
   *
   * INCRBY is the whole point: a get/modify/set round trip lets concurrent
   * callers all read the same value before any of them writes, which is how a
   * quota check ends up letting every request through. Returns null when Redis
   * is unavailable so the caller can fall back deliberately rather than
   * mistaking a failure for a count of zero.
   */
  async incrBy(key, amount, ttlSeconds = 3600) {
    if (!this.isReady) return null;
    try {
      const total = await this.client.incrby(key, amount);
      // Only set the TTL when the key is new, so a long-lived counter is not
      // repeatedly pushed out of expiry by later increments.
      if (total === amount) {
        await this.client.expire(key, ttlSeconds);
      }
      return total;
    } catch (error) {
      console.warn('Redis IncrBy Error:', error.message);
      return null;
    }
  }

  async zadd(key, score, member) {
    if (!this.isReady) return false;

    try {
      await this.client.zadd(key, score, member);
      return true;
    } catch (error) {
      console.warn('Redis ZAdd Error:', error.message);
      return false;
    }
  }

  async zscore(key, member) {
    if (!this.isReady) return null;

    try {
      return await this.client.zscore(key, member);
    } catch (error) {
      console.warn('Redis ZScore Error:', error.message);
      return null;
    }
  }

  async zrevrank(key, member) {
    if (!this.isReady) return null;

    try {
      return await this.client.zrevrank(key, member);
    } catch (error) {
      console.warn('Redis ZRevRank Error:', error.message);
      return null;
    }
  }

  async zrangeWithScores(key) {
    if (!this.isReady) return [];

    try {
      return await this.client.zrange(
        key,
        0,
        -1,
        'WITHSCORES'
      );
    } catch (error) {
      console.warn('Redis ZRange Error:', error.message);
      return [];
    }
  }

  async zcard(key) {
    if (!this.isReady) return 0;

    try {
      return await this.client.zcard(key);
    } catch (error) {
      console.warn('Redis ZCard Error:', error.message);
      return 0;
    }
  }    if (!this.isReady) return;
    try {
      // In a clustered environment, KEYS is bad, but for a single instance it's okay for our scope.
      const keys = await this.client.keys(keyPattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.warn('Redis Del Error:', error.message);
    }
  }
}

module.exports = new RedisService();

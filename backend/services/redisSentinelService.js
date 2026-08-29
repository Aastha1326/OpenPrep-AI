const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisSentinelService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.isSentinel = false;
  }

  connect() {
    if (this.client) return this.client;

    const sentinelHosts = process.env.REDIS_SENTINEL_HOSTS;
    const sentinelName = process.env.REDIS_SENTINEL_NAME || 'mymaster';
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    if (sentinelHosts) {
      logger.info('[RedisSentinel] Initializing HA Redis Sentinel connection...', { sentinels: sentinelHosts, name: sentinelName });
      const sentinels = sentinelHosts.split(',').map((h) => {
        const [host, port] = h.trim().split(':');
        return { host, port: Number(port) || 26379 };
      });

      this.client = new Redis({
        sentinels,
        name: sentinelName,
        maxRetriesPerRequest: 1,
        sentinelRetryStrategy(times) {
          if (times > 3) {
            logger.error('[RedisSentinel] Sentinel cluster unreachable.');
            return null; // Stop
          }
          return Math.min(times * 100, 2000);
        },
      });
      this.isSentinel = true;
    } else {
      logger.info('[RedisSentinel] Sentinel parameters not found. Falling back to single-instance Redis.', { url: redisUrl });
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
          if (times > 3) {
            logger.warn('[RedisSentinel] Single-instance Redis offline. Falling back locally.');
            return null;
          }
          return Math.min(times * 50, 2000);
        },
      });
      this.isSentinel = false;
    }

    this.client.on('error', (err) => {
      logger.warn('[RedisSentinel] Connection Error:', err.message);
      this.isReady = false;
    });

    this.client.on('ready', () => {
      logger.info('[RedisSentinel] Connection ready.');
      this.isReady = true;
    });

    // Monitor Sentinel failovers
    if (this.isSentinel) {
      this.client.on('+sentinel', (sentinel) => {
        logger.info('[RedisSentinel] Sentinel node discovered:', sentinel);
      });
      this.client.on('sentinel:switch-master', (masterName, fromIP, fromPort, toIP, toPort) => {
        logger.warn('[RedisSentinel] Switch master event occurred!', { masterName, fromIP, fromPort, toIP, toPort });
      });
    }

    return this.client;
  }

  /**
   * Blacklists a JTI (JWT ID) token across the cluster.
   */
  async blacklistJwt(jti, ttlSeconds = 3600) {
    if (!this.isReady || !this.client) return;
    try {
      const key = `jwt:blacklist:${jti}`;
      await this.client.set(key, 'true', 'EX', ttlSeconds);
      logger.info('[RedisSentinel] Token blacklisted successfully.', { jti, ttlSeconds });
    } catch (err) {
      logger.error('[RedisSentinel] Failed to blacklist JWT token:', err.message);
    }
  }

  /**
   * Checks if a JTI token is revoked.
   */
  async isJwtBlacklisted(jti) {
    if (!this.isReady || !this.client) return false;
    try {
      const key = `jwt:blacklist:${jti}`;
      const val = await this.client.get(key);
      return val === 'true';
    } catch (err) {
      logger.warn('[RedisSentinel] Failed to query token blacklist, allowing request:', err.message);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new RedisSentinelService();

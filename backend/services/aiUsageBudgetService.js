const logger = require('../utils/logger');
const db = require('../models');

const DEFAULT_CONFIG = {
  dailyUserLimit: 1000, // tokens per user per day
  hourlyUserLimit: 200, // tokens per user per hour
  dailyFeatureLimit: 5000, // tokens per feature per day
  requestsPerMinute: 30, // max requests per minute
  maxRetries: 3,
  retryBackoffMs: 1000, // initial backoff
  circuitBreakerThreshold: 5, // failures before open
  circuitBreakerResetMs: 60000, // 1 minute reset
};

class AIUsageBudgetService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.usageCache = new Map(); // In-memory cache for quick checks
    this.providerHealth = new Map(); // Track provider health
    this.initializeProviderHealth();
  }

  initializeProviderHealth() {
    const providers = ['gemini'];
    providers.forEach(provider => {
      this.providerHealth.set(provider, {
        status: 'healthy',
        consecutiveFailures: 0,
        circuitBreakerOpen: false,
        circuitBreakerOpenedAt: null,
      });
    });
  }

  /**
   * Check if user can make an AI request
   */
  async canMakeRequest(userId, feature) {
    try {
      // Check provider health first
      const providerStatus = this.getProviderHealth('gemini');
      if (providerStatus.circuitBreakerOpen) {
        const timeSinceOpen = Date.now() - providerStatus.circuitBreakerOpenedAt;
        if (timeSinceOpen < this.config.circuitBreakerResetMs) {
          logger.warn('Circuit breaker open for provider', { provider: 'gemini', userId, feature });
          return {
            allowed: false,
            reason: 'provider_circuit_breaker_open',
            retryAfter: this.config.circuitBreakerResetMs - timeSinceOpen,
          };
        } else {
          // Reset circuit breaker
          this.resetCircuitBreaker('gemini');
        }
      }

      // Check daily user limit
      const dailyUsage = await this.getDailyUserUsage(userId);
      if (dailyUsage >= this.config.dailyUserLimit) {
        logger.warn('Daily user limit exceeded', { userId, usage: dailyUsage, limit: this.config.dailyUserLimit });
        return {
          allowed: false,
          reason: 'daily_user_limit_exceeded',
          currentUsage: dailyUsage,
          limit: this.config.dailyUserLimit,
        };
      }

      // Check hourly user limit
      const hourlyUsage = await this.getHourlyUserUsage(userId);
      if (hourlyUsage >= this.config.hourlyUserLimit) {
        logger.warn('Hourly user limit exceeded', { userId, usage: hourlyUsage, limit: this.config.hourlyUserLimit });
        return {
          allowed: false,
          reason: 'hourly_user_limit_exceeded',
          currentUsage: hourlyUsage,
          limit: this.config.hourlyUserLimit,
        };
      }

      // Check feature limit
      const featureUsage = await this.getDailyFeatureUsage(feature);
      if (featureUsage >= this.config.dailyFeatureLimit) {
        logger.warn('Daily feature limit exceeded', { feature, usage: featureUsage, limit: this.config.dailyFeatureLimit });
        return {
          allowed: false,
          reason: 'daily_feature_limit_exceeded',
          currentUsage: featureUsage,
          limit: this.config.dailyFeatureLimit,
        };
      }

      return { allowed: true };
    } catch (err) {
      logger.error('Error checking AI budget', { error: err.message, userId, feature });
      // Fail open on error - allow request to proceed
      return { allowed: true };
    }
  }

  /**
   * Record AI request usage
   */
  async recordUsage(userId, feature, requestType, tokens = 0, status = 'success', metadata = {}) {
    try {
      const usage = await db.AIUsageLog.create({
        userId,
        feature,
        provider: 'gemini',
        requestType,
        estimatedTokens: tokens || 0,
        status,
        retryCount: metadata.retryCount || 0,
        responseTime: metadata.responseTime,
        errorMessage: metadata.errorMessage,
      });

      // Update cache
      this.updateCache(userId, feature, tokens);

      return usage;
    } catch (err) {
      logger.error('Error recording AI usage', { error: err.message, userId, feature });
    }
  }

  /**
   * Record provider failure
   */
  async recordProviderFailure(provider, errorType, errorMessage) {
    try {
      const health = this.getProviderHealth(provider);
      health.consecutiveFailures++;
      health.lastErrorType = errorType;
      health.lastErrorMessage = errorMessage;

      if (health.consecutiveFailures >= this.config.circuitBreakerThreshold) {
        health.circuitBreakerOpen = true;
        health.circuitBreakerOpenedAt = Date.now();
        health.status = 'unavailable';
        logger.error('Circuit breaker opened for provider', { provider, failures: health.consecutiveFailures });
      } else if (health.consecutiveFailures >= 2) {
        health.status = 'degraded';
      }

      await this.logProviderHealth(provider, health);
    } catch (err) {
      logger.error('Error recording provider failure', { error: err.message, provider });
    }
  }

  /**
   * Record provider success - reset failure counter
   */
  async recordProviderSuccess(provider) {
    try {
      const health = this.getProviderHealth(provider);
      health.consecutiveFailures = Math.max(0, health.consecutiveFailures - 1);
      health.status = health.consecutiveFailures === 0 ? 'healthy' : 'degraded';

      await this.logProviderHealth(provider, health);
    } catch (err) {
      logger.error('Error recording provider success', { error: err.message, provider });
    }
  }

  /**
   * Get retry configuration for current provider state
   */
  getRetryConfig(provider) {
    const health = this.getProviderHealth(provider);
    
    if (health.circuitBreakerOpen) {
      return {
        shouldRetry: false,
        reason: 'circuit_breaker_open',
      };
    }

    return {
      shouldRetry: true,
      maxAttempts: this.config.maxRetries,
      backoffMs: this.config.retryBackoffMs,
      backoffMultiplier: 2,
    };
  }

  /**
   * Calculate backoff delay with exponential increase
   */
  calculateBackoff(attemptNumber, baseBackoff = this.config.retryBackoffMs) {
    const delay = baseBackoff * Math.pow(2, attemptNumber - 1);
    const jitter = Math.random() * delay * 0.1; // 10% jitter
    return Math.min(delay + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Check if provider is healthy
   */
  isProviderHealthy(provider = 'gemini') {
    const health = this.getProviderHealth(provider);
    return !health.circuitBreakerOpen && health.status !== 'unavailable';
  }

  // ===== Private/Helper Methods =====

  async getDailyUserUsage(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db.AIUsageLog.sum('estimatedTokens', {
      where: {
        userId,
        createdAt: { [db.Sequelize.Op.gte]: today },
      },
    });

    return result || 0;
  }

  async getHourlyUserUsage(userId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await db.AIUsageLog.sum('estimatedTokens', {
      where: {
        userId,
        createdAt: { [db.Sequelize.Op.gte]: oneHourAgo },
      },
    });

    return result || 0;
  }

  async getDailyFeatureUsage(feature) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db.AIUsageLog.sum('estimatedTokens', {
      where: {
        feature,
        createdAt: { [db.Sequelize.Op.gte]: today },
      },
    });

    return result || 0;
  }

  getProviderHealth(provider) {
    if (!this.providerHealth.has(provider)) {
      this.providerHealth.set(provider, {
        status: 'healthy',
        consecutiveFailures: 0,
        circuitBreakerOpen: false,
        circuitBreakerOpenedAt: null,
      });
    }
    return this.providerHealth.get(provider);
  }

  resetCircuitBreaker(provider) {
    const health = this.getProviderHealth(provider);
    health.circuitBreakerOpen = false;
    health.circuitBreakerOpenedAt = null;
    health.consecutiveFailures = 0;
    health.status = 'healthy';
  }

  async logProviderHealth(provider, health) {
    try {
      await db.ProviderHealthStatus.upsert({
        provider,
        status: health.status,
        lastCheckedAt: new Date(),
        consecutiveFailures: health.consecutiveFailures,
        circuitBreakerOpen: health.circuitBreakerOpen,
        circuitBreakerOpenedAt: health.circuitBreakerOpenedAt,
      });
    } catch (err) {
      logger.error('Error logging provider health', { error: err.message, provider });
    }
  }

  updateCache(userId, feature, tokens) {
    const key = `${userId}:${feature}`;
    const cached = this.usageCache.get(key) || 0;
    this.usageCache.set(key, cached + tokens);
  }
}

module.exports = new AIUsageBudgetService();
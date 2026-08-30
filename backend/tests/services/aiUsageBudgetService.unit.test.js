const aiUsageBudgetService = require('../../services/aiUsageBudgetService');
const { executeWithRetry } = require('../../utils/aiRetryStrategy');

describe('AI Usage Budget Service', () => {
  beforeEach(() => {
    // Reset service state
    aiUsageBudgetService.usageCache.clear();
    aiUsageBudgetService.initializeProviderHealth();
  });

  describe('Budget Checking', () => {
    test('should allow request when under limit', async () => {
      const result = await aiUsageBudgetService.canMakeRequest('user-1', 'quiz-generation');
      expect(result.allowed).toBe(true);
    });

    test('should block request when daily user limit exceeded', async () => {
      // Mock high usage
      jest.spyOn(aiUsageBudgetService, 'getDailyUserUsage').mockResolvedValue(1001);

      const result = await aiUsageBudgetService.canMakeRequest('user-1', 'quiz-generation');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('daily_user_limit_exceeded');
    });

    test('should block request when hourly limit exceeded', async () => {
      jest.spyOn(aiUsageBudgetService, 'getHourlyUserUsage').mockResolvedValue(201);

      const result = await aiUsageBudgetService.canMakeRequest('user-2', 'study-planning');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('hourly_user_limit_exceeded');
    });

    test('should block request when feature limit exceeded', async () => {
      jest.spyOn(aiUsageBudgetService, 'getDailyFeatureUsage').mockResolvedValue(5001);

      const result = await aiUsageBudgetService.canMakeRequest('user-3', 'doubt-solver');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('daily_feature_limit_exceeded');
    });
  });

  describe('Provider Health Tracking', () => {
    test('should track consecutive failures', async () => {
      await aiUsageBudgetService.recordProviderFailure('gemini', 'timeout', 'Request timeout');
      let health = aiUsageBudgetService.getProviderHealth('gemini');
      expect(health.consecutiveFailures).toBe(1);

      await aiUsageBudgetService.recordProviderFailure('gemini', 'timeout', 'Request timeout');
      health = aiUsageBudgetService.getProviderHealth('gemini');
      expect(health.consecutiveFailures).toBe(2);
    });

    test('should open circuit breaker on threshold', async () => {
      for (let i = 0; i < 5; i++) {
        await aiUsageBudgetService.recordProviderFailure('gemini', 'error', 'Provider error');
      }

      const health = aiUsageBudgetService.getProviderHealth('gemini');
      expect(health.circuitBreakerOpen).toBe(true);
      expect(health.status).toBe('unavailable');
    });

    test('should block requests when circuit breaker is open', async () => {
      const health = aiUsageBudgetService.getProviderHealth('gemini');
      health.circuitBreakerOpen = true;
      health.circuitBreakerOpenedAt = Date.now();

      const result = await aiUsageBudgetService.canMakeRequest('user-1', 'quiz-generation');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('provider_circuit_breaker_open');
    });

    test('should reset circuit breaker after timeout', async () => {
      const health = aiUsageBudgetService.getProviderHealth('gemini');
      health.circuitBreakerOpen = true;
      health.circuitBreakerOpenedAt = Date.now() - 61000; // 61 seconds ago

      // Simulate auto-reset
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await aiUsageBudgetService.canMakeRequest('user-1', 'quiz-generation');
      // Should be allowed after reset
      expect(result.allowed).toBe(true);
    });

    test('should reset failure counter on success', async () => {
      await aiUsageBudgetService.recordProviderFailure('gemini', 'error', 'Test error');
      let health = aiUsageBudgetService.getProviderHealth('gemini');
      expect(health.consecutiveFailures).toBe(1);

      await aiUsageBudgetService.recordProviderSuccess('gemini');
      health = aiUsageBudgetService.getProviderHealth('gemini');
      expect(health.consecutiveFailures).toBe(0);
      expect(health.status).toBe('healthy');
    });
  });

  describe('Retry Strategy', () => {
    test('should calculate exponential backoff', () => {
      const backoff1 = aiUsageBudgetService.calculateBackoff(1);
      const backoff2 = aiUsageBudgetService.calculateBackoff(2);
      const backoff3 = aiUsageBudgetService.calculateBackoff(3);

      expect(backoff2).toBeGreaterThan(backoff1);
      expect(backoff3).toBeGreaterThan(backoff2);
    });

    test('should cap backoff at max time', () => {
      const backoff = aiUsageBudgetService.calculateBackoff(10);
      expect(backoff).toBeLessThanOrEqual(30000);
    });

    test('should return no retry config when circuit breaker open', () => {
      const health = aiUsageBudgetService.getProviderHealth('gemini');
      health.circuitBreakerOpen = true;

      const config = aiUsageBudgetService.getRetryConfig('gemini');
      expect(config.shouldRetry).toBe(false);
      expect(config.reason).toBe('circuit_breaker_open');
    });

    test('should return retry config when healthy', () => {
      const config = aiUsageBudgetService.getRetryConfig('gemini');
      expect(config.shouldRetry).toBe(true);
      expect(config.maxAttempts).toBeGreaterThan(0);
    });
  });

  describe('Usage Recording', () => {
    test('should record successful usage', async () => {
      jest.spyOn(require('../models'), 'AIUsageLog', 'create').mockResolvedValue({
        id: 'log-1',
        userId: 'user-1',
        feature: 'quiz-generation',
        status: 'success',
      });

      const result = await aiUsageBudgetService.recordUsage(
        'user-1',
        'quiz-generation',
        'text-generation',
        100,
        'success'
      );

      expect(result).toBeDefined();
    });

    test('should track quota exceeded errors', async () => {
      jest.spyOn(require('../models'), 'AIUsageLog', 'create').mockResolvedValue({
        id: 'log-2',
        status: 'quota_exceeded',
      });

      const result = await aiUsageBudgetService.recordUsage(
        'user-1',
        'quiz-generation',
        'text-generation',
        0,
        'quota_exceeded'
      );

      expect(result.status).toBe('quota_exceeded');
    });
  });

  describe('Integration with Retry Strategy', () => {
    test('should execute request with retry on transient error', async () => {
      let attempts = 0;
      const requestFn = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          const error = new Error('Timeout');
          error.status = 503;
          throw error;
        }
        return { success: true };
      });

      jest.spyOn(aiUsageBudgetService, 'canMakeRequest').mockResolvedValue({ allowed: true });
      jest.spyOn(aiUsageBudgetService, 'isProviderHealthy').mockReturnValue(true);

      const result = await executeWithRetry(requestFn, {
        userId: 'user-1',
        feature: 'quiz-generation',
      });

      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
    });

    test('should fail immediately on non-retryable error', async () => {
      const requestFn = jest.fn(async () => {
        const error = new Error('Not found');
        error.status = 404;
        throw error;
      });

      jest.spyOn(aiUsageBudgetService, 'canMakeRequest').mockResolvedValue({ allowed: true });
      jest.spyOn(aiUsageBudgetService, 'isProviderHealthy').mockReturnValue(true);

      await expect(executeWithRetry(requestFn, {
        userId: 'user-1',
        feature: 'quiz-generation',
      })).rejects.toThrow('Not found');

      expect(requestFn).toHaveBeenCalledTimes(1);
    });

    test('should fail when budget check fails', async () => {
      const requestFn = jest.fn();

      jest.spyOn(aiUsageBudgetService, 'canMakeRequest').mockResolvedValue({
        allowed: false,
        reason: 'daily_user_limit_exceeded',
      });

      await expect(executeWithRetry(requestFn, {
        userId: 'user-1',
        feature: 'quiz-generation',
      })).rejects.toThrow('AI budget limit');

      expect(requestFn).not.toHaveBeenCalled();
    });
  });

  describe('Provider Health Status', () => {
    test('should mark provider as degraded after 2 failures', async () => {
      await aiUsageBudgetService.recordProviderFailure('gemini', 'error', 'Error 1');
      await aiUsageBudgetService.recordProviderFailure('gemini', 'error', 'Error 2');

      const health = aiUsageBudgetService.getProviderHealth('gemini');
      expect(health.status).toBe('degraded');
    });

    test('should indicate provider healthy when no failures', () => {
      const isHealthy = aiUsageBudgetService.isProviderHealthy('gemini');
      expect(isHealthy).toBe(true);
    });

    test('should indicate provider unhealthy when circuit open', () => {
      const health = aiUsageBudgetService.getProviderHealth('gemini');
      health.circuitBreakerOpen = true;

      const isHealthy = aiUsageBudgetService.isProviderHealthy('gemini');
      expect(isHealthy).toBe(false);
    });
  });
});
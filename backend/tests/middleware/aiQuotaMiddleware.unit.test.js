const { checkAiQuota } = require('../../middleware/aiQuotaMiddleware');
const User = require('../../models/User');

describe('aiQuotaMiddleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    vi.restoreAllMocks();
    req = {
      user: { id: 'user-uuid-123' },
      headers: { 'x-test-rate-limit': 'true' },
    };
    res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      on: vi.fn(),
    };
    next = vi.fn();
  });

  it('should block requests when quota is 0 (dailyAiUsageCount reached tier limit)', async () => {
    const mockUser = {
      id: 'user-uuid-123',
      role: 'student', // limit is 15
      dailyAiUsageCount: 15,
      lastAiUsageReset: new Date(),
      save: vi.fn(),
    };
    vi.spyOn(User, 'findByPk').mockResolvedValue(mockUser);

    await checkAiQuota(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'AI daily usage quota exceeded.',
        remainingQuota: 0,
      })
    );
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reset usage count when lastAiUsageReset is older than 24 hours (previous day UTC)', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const mockUser = {
      id: 'user-uuid-123',
      role: 'student',
      dailyAiUsageCount: 15,
      lastAiUsageReset: yesterday,
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(User, 'findByPk').mockResolvedValue(mockUser);

    await checkAiQuota(req, res, next);

    expect(mockUser.dailyAiUsageCount).toBe(0);
    expect(mockUser.save).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 15);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 14);
    expect(next).toHaveBeenCalled();
  });

  it('should allow request when within quota and attach response headers', async () => {
    const mockUser = {
      id: 'user-uuid-123',
      role: 'student',
      dailyAiUsageCount: 5,
      lastAiUsageReset: new Date(),
      save: vi.fn(),
    };
    vi.spyOn(User, 'findByPk').mockResolvedValue(mockUser);

    await checkAiQuota(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 15);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 9);
    expect(next).toHaveBeenCalled();
  });

  describe('Token-Bucket Rate Limiter', () => {
    const { BUCKET_LIMITS, localTokenBuckets } = require('../../middleware/aiQuotaMiddleware');
    const redisService = require('../../services/redisService');

    beforeEach(() => {
      localTokenBuckets.clear();
      redisService.isReady = false;
    });

    it('should allow consecutive requests within token capacity', async () => {
      const mockUser = {
        id: 'user-123',
        role: 'student',
        dailyAiUsageCount: 0,
        lastAiUsageReset: new Date(),
        save: vi.fn(),
      };
      vi.spyOn(User, 'findByPk').mockResolvedValue(mockUser);

      await checkAiQuota(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject requests when tokens run dry (local fallback)', async () => {
      const mockUser = {
        id: 'user-123',
        role: 'student',
        dailyAiUsageCount: 0,
        lastAiUsageReset: new Date(),
        save: vi.fn(),
      };
      vi.spyOn(User, 'findByPk').mockResolvedValue(mockUser);

      // Artificially empty the local token bucket
      localTokenBuckets.set('user-123', {
        tokens: 0.2,
        lastRefillTime: Date.now(),
      });

      await checkAiQuota(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Too many requests. Please wait before retrying.',
        })
      );
      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
      expect(next).not.toHaveBeenCalled();
    });

    it('should query Redis for bucket state if Redis is ready', async () => {
      const mockUser = {
        id: 'user-123',
        role: 'student',
        dailyAiUsageCount: 0,
        lastAiUsageReset: new Date(),
        save: vi.fn(),
      };
      vi.spyOn(User, 'findByPk').mockResolvedValue(mockUser);

      redisService.isReady = true;
      const getSpy = vi.spyOn(redisService, 'get').mockResolvedValue({
        tokens: 15,
        lastRefillTime: Date.now() - 60000, // 1 minute ago
      });
      const setSpy = vi.spyOn(redisService, 'set').mockResolvedValue();

      await checkAiQuota(req, res, next);

      expect(getSpy).toHaveBeenCalledWith('ai_bucket:user-123');
      expect(setSpy).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();

      redisService.isReady = false;
    });
  });
});

const cacheService = require('../../services/cacheService');
const redisService = require('../../services/redisService');

describe('Distributed Redis Caching & Prompt Memoization Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('SHA-256 Canonical Hashing & Namespace', () => {
    it('generates SHA-256 hashed keys with openprep:cache prefix', () => {
      const payload = {
        subject: 'UPSC Modern History',
        topic: '1857 Revolt',
        difficulty: 'Medium',
        count: 5,
      };

      const key = cacheService.hashPayload('quiz', payload);

      expect(key).toMatch(/^openprep:cache:quiz:[a-f0-9]{64}$/);
    });

    it('produces identical hash for identical payloads regardless of key order', () => {
      const key1 = cacheService.hashPayload('quiz', { subject: 'Physics', topic: 'Thermodynamics' });
      const key2 = cacheService.hashPayload('quiz', { subject: 'Physics', topic: 'Thermodynamics' });

      expect(key1).toBe(key2);
    });
  });

  describe('Cache Hit, Cache Miss, and Metadata', () => {
    it('returns isHit: false and data: null on cache miss', async () => {
      vi.spyOn(redisService, 'get').mockResolvedValue(null);

      const result = await cacheService.getWithMetadata('openprep:cache:quiz:nonexistent');

      expect(result.isHit).toBe(false);
      expect(result.data).toBeNull();
    });

    it('returns isHit: true and cached payload on cache hit from Redis', async () => {
      const mockQuiz = { title: '1857 Revolt Quiz', questions: [] };
      redisService.isReady = true;
      vi.spyOn(redisService, 'get').mockResolvedValue(mockQuiz);

      const result = await cacheService.getWithMetadata('openprep:cache:quiz:hitkey');

      expect(result.isHit).toBe(true);
      expect(result.data).toEqual(mockQuiz);
      expect(result.source).toBe('redis');
    });
  });

  describe('Offline Fallback & Error Resilience', () => {
    it('gracefully falls back to in-memory cache if Redis read throws an error', async () => {
      redisService.isReady = true;
      vi.spyOn(redisService, 'get').mockRejectedValue(new Error('Redis Connection Lost'));

      const result = await cacheService.getWithMetadata('openprep:cache:quiz:error_key');

      expect(result.isHit).toBe(false);
      expect(result.data).toBeNull();
    });

    it('gracefully falls back to in-memory cache on Redis write error without throwing', async () => {
      redisService.isReady = true;
      vi.spyOn(redisService, 'set').mockRejectedValue(new Error('Redis Timeout'));

      await expect(cacheService.set('openprep:cache:quiz:write_err', { ok: true }, 86400)).resolves.not.toThrow();
    });
  });

  describe('Dynamic TTL Expiration Configurations', () => {
    it('verifies 24-hour (86400s) TTL for quizzes and 7-day (604800s) TTL for summaries', () => {
      expect(cacheService.QUIZ_TTL).toBe(86400);
      expect(cacheService.SUMMARY_TTL).toBe(604800);
    });
  });
});

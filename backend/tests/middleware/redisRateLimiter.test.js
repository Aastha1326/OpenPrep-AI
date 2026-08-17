const express = require('express');
const request = require('supertest');
const { authRateLimiter, aiRateLimiter, standardGetRateLimiter } = require('../../middleware/redisRateLimiter');
const redisService = require('../../services/redisService');

// Helper to make multiple sequential requests with test override header
async function sendRequests(app, path, count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    const res = await request(app)
      .get(path)
      .set('x-test-rate-limit', 'true');
    results.push(res);
  }
  return results;
}

describe('Redis Rate Limiter Middleware', () => {
  let app;
  let mockRedisClient;

  beforeEach(() => {
    // 1. Setup mock Express app
    app = express();
    app.get('/auth-test', authRateLimiter, (req, res) => {
      res.status(200).json({ success: true, data: 'auth' });
    });
    app.get('/ai-test', aiRateLimiter, (req, res) => {
      res.status(200).json({ success: true, data: 'ai' });
    });
    app.get('/get-test', standardGetRateLimiter, (req, res) => {
      res.status(200).json({ success: true, data: 'get' });
    });

    // 2. Setup Redis Mocks
    mockRedisClient = {
      tokenBucket: vi.fn(),
      defineCommand: vi.fn(),
    };
  });

  describe('Fallback Mode (Redis Offline)', () => {
    beforeEach(() => {
      redisService.isReady = false;
      redisService.client = null;
    });

    it('should limit auth requests to 5 per minute and return headers', async () => {
      const results = await sendRequests(app, '/auth-test', 6);
      
      const successResults = results.filter(r => r.status === 200);
      const rateLimitedResults = results.filter(r => r.status === 429);

      expect(successResults.length).toBe(5);
      expect(rateLimitedResults.length).toBe(1);

      const blockRes = rateLimitedResults[0];
      expect(blockRes.headers['x-ratelimit-limit']).toBe('5');
      expect(blockRes.headers['x-ratelimit-remaining']).toBe('0');
      expect(blockRes.headers['retry-after']).toBeDefined();
      expect(blockRes.body.success).toBe(false);
      expect(blockRes.body.error).toContain('Too many login attempts');
    });

    it('should limit AI requests to 15 per minute', async () => {
      const results = await sendRequests(app, '/ai-test', 16);
      
      const successResults = results.filter(r => r.status === 200);
      const rateLimitedResults = results.filter(r => r.status === 429);

      expect(successResults.length).toBe(15);
      expect(rateLimitedResults.length).toBe(1);
    });

    it('should limit standard GET requests to 100 per minute', async () => {
      const results = await sendRequests(app, '/get-test', 101);
      
      const successResults = results.filter(r => r.status === 200);
      const rateLimitedResults = results.filter(r => r.status === 429);

      expect(successResults.length).toBe(100);
      expect(rateLimitedResults.length).toBe(1);
    });
  });

  describe('Distributed Mode (Redis Online)', () => {
    beforeEach(() => {
      redisService.isReady = true;
      redisService.client = mockRedisClient;
    });

    it('should query Redis client and handle allowed requests', async () => {
      // Mock Redis returning allowed = true, remaining = 4, retryAfter = 0
      mockRedisClient.tokenBucket.mockResolvedValueOnce([1, 4, 0]);

      const res = await request(app)
        .get('/auth-test')
        .set('x-test-rate-limit', 'true');

      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('5');
      expect(res.headers['x-ratelimit-remaining']).toBe('4');
    });

    it('should query Redis client and handle rate limited requests', async () => {
      // Mock Redis returning allowed = false, remaining = 0, retryAfter = 45
      mockRedisClient.tokenBucket.mockResolvedValueOnce([0, 0, 45]);

      const res = await request(app)
        .get('/auth-test')
        .set('x-test-rate-limit', 'true');

      expect(res.status).toBe(429);
      expect(res.headers['x-ratelimit-limit']).toBe('5');
      expect(res.headers['x-ratelimit-remaining']).toBe('0');
      expect(res.headers['retry-after']).toBe('45');
      expect(res.body.success).toBe(false);
    });
  });
});

const express = require('express');
const request = require('supertest');
const { aiLimiter } = require('../../middleware/rateLimiter');
const { checkAiQuota } = require('../../middleware/aiQuotaMiddleware');
const User = require('../../models/User');

describe('AI Route Rate Limiter Integration', () => {
  let app;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    app = express();
    app.use(express.json());

    app.use((req, res, next) => {
      req.user = { id: 'test-user-rate-limit-id' };
      next();
    });

    app.post(
      '/api/notes/test-summarize',
      (req, res, next) => {
        req.headers['x-test-rate-limit'] = 'true';
        next();
      },
      aiLimiter,
      checkAiQuota,
      (req, res) => {
        res.status(200).json({ success: true, message: 'AI note summarized' });
      }
    );
  });

  it('should restrict requests when exceeding 10 calls per window and return 429 on 11th request', async () => {
    vi.spyOn(User, 'findByPk').mockResolvedValue({
      id: 'test-user-rate-limit-id',
      role: 'student',
      dailyAiUsageCount: 0,
      lastAiUsageReset: new Date(),
      save: vi.fn(),
    });

    // Make 10 rapid calls
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/notes/test-summarize').send();
      expect(res.status).toBe(200);
    }

    // 11th call should trigger rate limiter (429)
    const EleventhRes = await request(app).post('/api/notes/test-summarize').send();
    expect(EleventhRes.status).toBe(429);
    expect(EleventhRes.body).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.stringMatching(/rate limit|quota/i),
        retryInSeconds: expect.any(Number),
        remainingQuota: 0,
      })
    );
    expect(EleventhRes.headers['retry-after']).toBeDefined();
  });
});

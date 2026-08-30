delete require.cache[require.resolve('../../services/redisService')];
delete require.cache[require.resolve('../../config/redis')];
delete require.cache[require.resolve('../../utils/cacheManager')];
delete require.cache[require.resolve('../../middleware/cacheMiddleware')];

const express = require('express');
const request = require('supertest');
const cacheMiddleware = require('../../middleware/cacheMiddleware');
const cacheManager = require('../../utils/cacheManager');
const redisService = require('../../services/redisService');

describe('cacheMiddleware Integration Tests', () => {
  let app;
  let callCount;
  let mockStore;

  beforeEach(async () => {
    callCount = 0;
    mockStore = new Map();
    
    redisService.isReady = true;
    vi.spyOn(redisService, 'get').mockImplementation(async (key) => mockStore.get(key) || null);
    vi.spyOn(redisService, 'set').mockImplementation(async (key, value) => {
      mockStore.set(key, value);
      return true;
    });
    vi.spyOn(redisService, 'del').mockImplementation(async (pattern) => {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        for (const key of mockStore.keys()) {
          if (key.startsWith(prefix)) {
            mockStore.delete(key);
          }
        }
      } else {
        mockStore.delete(pattern);
      }
      return true;
    });

    // Invalidate everything to start clean
    await cacheManager.invalidate('user_testUser:*');

    app = express();
    app.use(express.json());

    // Mock protect middleware to attach user object
    const mockProtect = (req, res, next) => {
      req.user = { id: 'testUser' };
      next();
    };

    app.get(
      '/api/test-cache',
      mockProtect,
      cacheMiddleware(30),
      (req, res) => {
        callCount++;
        res.status(200).json({ success: true, count: callCount });
      }
    );
  });

  it('should cache GET requests and return HIT/MISS headers', async () => {
    // First request - MISS
    const res1 = await request(app).get('/api/test-cache');
    expect(res1.status).toBe(200);
    expect(res1.headers['x-cache']).toBe('MISS');
    expect(res1.body.count).toBe(1);

    // Second request - HIT
    const res2 = await request(app).get('/api/test-cache');
    expect(res2.status).toBe(200);
    expect(res2.headers['x-cache']).toBe('HIT');
    expect(res2.body.count).toBe(1); // count should still be 1 (cached)
    expect(callCount).toBe(1); // Controller only called once
  });

  it('should serve fresh response after cache invalidation', async () => {
    // First request - MISS
    const res1 = await request(app).get('/api/test-cache');
    expect(res1.headers['x-cache']).toBe('MISS');

    // Invalidate cache for the user
    await cacheManager.invalidate('user_testUser:*');

    // Second request - MISS (since invalidated)
    const res2 = await request(app).get('/api/test-cache');
    expect(res2.status).toBe(200);
    expect(res2.headers['x-cache']).toBe('MISS');
    expect(res2.body.count).toBe(2);
    expect(callCount).toBe(2);
  });
});

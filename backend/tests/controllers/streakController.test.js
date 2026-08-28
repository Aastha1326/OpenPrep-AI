import { describe, it, expect, vi, beforeEach } from 'vitest';
const request = require('supertest');
const { app } = require('../../server'); // Adjust this if server.js doesn't export app directly. Wait, server.js exports app: module.exports = app;
const { User, ActivityLog } = require('../../models');

// We will mock the auth middleware and models
vi.mock('../../middleware/auth', () => ({
  protect: (req, res, next) => {
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = { id: 'test-user-id' };
      return next();
    }
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
}));

vi.mock('../../models', () => {
  return {
    User: {
      findByPk: vi.fn()
    },
    ActivityLog: {
      findAll: vi.fn(),
      create: vi.fn()
    }
  };
});

// Assuming server.js is the entry point
const serverApp = require('../../server');

describe('Streak Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/streaks/summary', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(serverApp).get('/api/streaks/summary');
      expect(res.status).toBe(401);
    });

    it('should return streak summary for valid user', async () => {
      User.findByPk.mockResolvedValue({
        id: 'test-user-id',
        currentStreak: 5,
        longestStreak: 10,
        xp: 1500,
        studyHours: 2.5,
        lastActivityDate: '2026-08-28'
      });

      const res = await request(serverApp)
        .get('/api/streaks/summary')
        .set('Authorization', 'Bearer valid-token');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStreak).toBe(5);
      expect(res.body.data.studyMinutes).toBe(150); // 2.5 * 60
    });
  });

  describe('GET /api/streaks/heatmap', () => {
    it('should return heatmap data', async () => {
      const now = new Date();
      ActivityLog.findAll.mockResolvedValue([
        { timestamp: now },
        { timestamp: now }
      ]);

      const res = await request(serverApp)
        .get('/api/streaks/heatmap')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const dateStr = now.toISOString().split('T')[0];
      expect(res.body.data[dateStr]).toBe(2);
    });
  });

  describe('GET /api/streaks/analytics', () => {
    it('should return 12-week consistency analytics', async () => {
      ActivityLog.findAll.mockResolvedValue([]);

      const res = await request(serverApp)
        .get('/api/streaks/analytics')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.weeklyActivityCounts.length).toBe(12);
      expect(res.body.data.weeklyConsistencyPercentages.length).toBe(12);
    });
  });

  describe('GET /api/streaks/probability', () => {
    it('should return maintenance probability', async () => {
      User.findByPk.mockResolvedValue({ id: 'test-user-id', currentStreak: 10 });

      const res = await request(serverApp)
        .get('/api/streaks/probability')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.sevenDayProbability).toBeGreaterThan(0);
      expect(res.body.data.thirtyDayProbability).toBeGreaterThan(0);
    });
  });

  describe('GET /api/streaks/recommendations', () => {
    it('should return personalized recommendations', async () => {
      const res = await request(serverApp)
        .get('/api/streaks/recommendations')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].title).toBeDefined();
    });
  });

  describe('POST /api/streaks/log', () => {
    it('should return 400 if activityType is missing', async () => {
      const res = await request(serverApp)
        .post('/api/streaks/log')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should log activity and update streak', async () => {
      ActivityLog.create.mockResolvedValue({});
      User.findByPk.mockResolvedValue({ id: 'test-user-id', currentStreak: 5, save: vi.fn() });

      const res = await request(serverApp)
        .post('/api/streaks/log')
        .set('Authorization', 'Bearer valid-token')
        .send({ activityType: 'quiz_attempt' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(ActivityLog.create).toHaveBeenCalled();
    });
  });
});

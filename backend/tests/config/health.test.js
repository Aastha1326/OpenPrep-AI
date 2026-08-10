const express = require('express');
const request = require('supertest');
const { sequelize } = require('../../config/db');

// Create a test app that matches the routes in server.js
function createTestApp() {
  const app = express();

  app.get(['/api/v1/health', '/api/health'], async (req, res) => {
    try {
      const { sequelize: db } = require('../../config/db');
      await db.authenticate();
      res.status(200).json({
        status: 'ok',
        db: 'connected',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        db: 'disconnected',
        error: error.message,
      });
    }
  });

  return app;
}

describe('Health Check Endpoints', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  it('should return 200 with JSON payload when db connection is healthy', async () => {
    // Mock successful authentication
    const authSpy = vi.spyOn(sequelize, 'authenticate').mockResolvedValueOnce();

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(res.body.uptime).toBeDefined();
    expect(res.body.memoryUsage).toBeDefined();
    expect(authSpy).toHaveBeenCalled();
  });

  it('should also respond successfully on /api/health path alias', async () => {
    vi.spyOn(sequelize, 'authenticate').mockResolvedValueOnce();

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
  });

  it('should return 500 and status error when db connection fails', async () => {
    // Mock failed authentication
    const authSpy = vi.spyOn(sequelize, 'authenticate').mockRejectedValueOnce(new Error('Connection timeout'));

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.db).toBe('disconnected');
    expect(res.body.error).toBe('Connection timeout');
    expect(authSpy).toHaveBeenCalled();
  });
});

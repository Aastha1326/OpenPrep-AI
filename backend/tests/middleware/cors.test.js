const request = require('supertest');
const express = require('express');
const errorHandler = require('../../middleware/error');

describe('CORS Whitelist Enforcement Integration Tests', () => {
  let app;

  beforeEach(() => {
    // Clear node cache to load fresh CORS handler configured with latest process.env variables
    delete require.cache[require.resolve('../../middleware/corsHandler')];
    const { getCorsMiddleware } = require('../../middleware/corsHandler');

    app = express();
    app.use(express.json());
    app.use(getCorsMiddleware());
    
    app.get('/test-cors', (req, res) => {
      res.status(200).json({ success: true, data: 'allowed' });
    });
    
    app.use(errorHandler);
  });

  describe('When CLIENT_URL is defined', () => {
    beforeAll(() => {
      process.env.CLIENT_URL = 'http://trustedapp.com, https://anotherapp.com';
    });

    afterAll(() => {
      delete process.env.CLIENT_URL;
    });

    it('should allow requests with no Origin header (e.g. Mobile Apps/Curl)', async () => {
      const res = await request(app).get('/test-cors');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBe('allowed');
    });

    it('should allow requests matching whitelisted domains in CLIENT_URL', async () => {
      const res1 = await request(app)
        .get('/test-cors')
        .set('Origin', 'http://trustedapp.com');
      
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      const res2 = await request(app)
        .get('/test-cors')
        .set('Origin', 'https://anotherapp.com');
      
      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
    });

    it('should block requests from non-whitelisted domains with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/test-cors')
        .set('Origin', 'http://malicioussite.com');
      
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Not allowed by CORS');
    });
  });

  describe('When CLIENT_URL is undefined (defaults to localhost dev)', () => {
    beforeAll(() => {
      delete process.env.CLIENT_URL;
      delete process.env.CORS_ORIGIN;
    });

    it('should allow requests from local Vite server http://localhost:5173', async () => {
      const res = await request(app)
        .get('/test-cors')
        .set('Origin', 'http://localhost:5173');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should block other domains with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/test-cors')
        .set('Origin', 'http://unauthorized.com');
      
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Not allowed by CORS');
    });
  });
});

const { doubleCsrfProtection, generateCsrfToken, csrfErrorHandler } = require('../../middleware/securityMiddleware');
const { authRateLimiter, aiRateLimiter, generalRateLimiter } = require('../../middleware/rateLimitMiddleware');
const { buildAllowedOrigins, getCorsMiddleware, getSocketCorsOrigin } = require('../../middleware/corsHandler');

describe('Security Middleware Suite', () => {
  describe('CSRF Protection', () => {
    it('exports doubleCsrf protection functions', () => {
      expect(doubleCsrfProtection).toBeDefined();
      expect(generateCsrfToken).toBeDefined();
      expect(csrfErrorHandler).toBeDefined();
      expect(typeof doubleCsrfProtection).toBe('function');
      expect(typeof generateCsrfToken).toBe('function');
      expect(typeof csrfErrorHandler).toBe('function');
    });

    it('csrfErrorHandler handles EBADCSRFTOKEN error with 403 Forbidden status', () => {
      const err = new Error('Invalid CSRF');
      err.code = 'EBADCSRFTOKEN';

      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      const next = vi.fn();

      csrfErrorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or missing CSRF token',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('csrfErrorHandler passes non-CSRF errors to next()', () => {
      const err = new Error('Database Error');
      const req = {};
      const res = {};
      const next = vi.fn();

      csrfErrorHandler(err, req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('CORS Origin Whitelisting', () => {
    it('builds allowed origins from environment variables', () => {
      const originalEnv = process.env.CLIENT_ORIGIN;
      process.env.CLIENT_ORIGIN = 'https://openprep.ai, http://localhost:5173/';

      const origins = buildAllowedOrigins();

      expect(origins.has('https://openprep.ai')).toBe(true);
      expect(origins.has('http://localhost:5173')).toBe(true);

      process.env.CLIENT_ORIGIN = originalEnv;
    });

    it('exports cors middleware generators', () => {
      expect(typeof getCorsMiddleware).toBe('function');
      expect(typeof getSocketCorsOrigin).toBe('function');
    });
  });

  describe('Rate Limiting', () => {
    it('exports authRateLimiter, aiRateLimiter, and generalRateLimiter', () => {
      expect(authRateLimiter).toBeDefined();
      expect(aiRateLimiter).toBeDefined();
      expect(generalRateLimiter).toBeDefined();
      expect(typeof authRateLimiter).toBe('function');
      expect(typeof aiRateLimiter).toBe('function');
      expect(typeof generalRateLimiter).toBe('function');
    });
  });
});

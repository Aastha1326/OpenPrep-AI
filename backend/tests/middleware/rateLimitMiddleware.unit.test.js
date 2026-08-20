const { authRateLimiter, aiRateLimiter, generalRateLimiter } = require('../../middleware/rateLimitMiddleware');

describe('Rate Limit Middleware Unit Tests', () => {
  it('should export rate limiter components', () => {
    expect(authRateLimiter).toBeDefined();
    expect(aiRateLimiter).toBeDefined();
    expect(generalRateLimiter).toBeDefined();
    expect(typeof authRateLimiter).toBe('function');
    expect(typeof aiRateLimiter).toBe('function');
    expect(typeof generalRateLimiter).toBe('function');
  });
});

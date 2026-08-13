const { doubleCsrfProtection, generateCsrfToken, csrfErrorHandler } = require('../../middleware/securityMiddleware');

describe('Security Middleware Unit Tests', () => {
  it('should export security middleware components', () => {
    expect(doubleCsrfProtection).toBeDefined();
    expect(generateCsrfToken).toBeDefined();
    expect(csrfErrorHandler).toBeDefined();
    expect(typeof doubleCsrfProtection).toBe('function');
    expect(typeof generateCsrfToken).toBe('function');
    expect(typeof csrfErrorHandler).toBe('function');
  });
});

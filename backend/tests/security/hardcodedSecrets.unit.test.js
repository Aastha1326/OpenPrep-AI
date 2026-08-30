import { describe, it, expect, vi, beforeEach } from 'vitest';

function clearRequireCache(pathSubstr) {
  const normalizedSubstr = pathSubstr.replace(/\\/g, '/').toLowerCase();
  for (const key of Object.keys(require.cache)) {
    if (key.replace(/\\/g, '/').toLowerCase().includes(normalizedSubstr)) {
      delete require.cache[key];
    }
  }
}

describe('Hardcoded Secrets & Environment Validation Unit Tests', () => {
  beforeEach(() => {
    vi.resetModules();
    clearRequireCache('controllers/authController');
    clearRequireCache('middleware/securityMiddleware');
    clearRequireCache('utils/encryption');
    clearRequireCache('config/db');
  });

  it('authController throws when JWT_SECRET is unset', () => {
    vi.stubEnv('JWT_SECRET', '');
    expect(() => require('../../controllers/authController')).toThrow('JWT_SECRET environment variable is required');
    vi.unstubAllEnvs();
  });

  it('doubleCsrfOptions.getSecret() throws when CSRF_SECRET is unset', () => {
    vi.stubEnv('CSRF_SECRET', '');
    const { doubleCsrfOptions } = require('../../middleware/securityMiddleware');
    expect(() => doubleCsrfOptions.getSecret()).toThrow('CSRF_SECRET environment variable is required');
    vi.unstubAllEnvs();
  });

  it('getKey() throws when ENCRYPTION_KEY is unset', () => {
    vi.stubEnv('ENCRYPTION_KEY', '');
    const { encryptToken } = require('../../utils/encryption');
    expect(() => encryptToken('test-data')).toThrow('ENCRYPTION_KEY environment variable is required');
    vi.unstubAllEnvs();
  });

  it('sequelize configuration throws when DATABASE_URL is unset', () => {
    vi.stubEnv('DATABASE_URL', '');
    expect(() => require('../../config/db')).toThrow('DATABASE_URL environment variable is required');
    vi.unstubAllEnvs();
  });
});

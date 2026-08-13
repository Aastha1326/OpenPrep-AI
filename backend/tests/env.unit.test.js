const {
  loadEnv,
  validateEnv,
  formatErrors,
  summariseIntegrations,
  isPlaceholder,
  normaliseEnv,
  MIN_SECRET_LENGTH,
} = require('../config/env');

/**
 * A minimally valid production environment, used as the base for the
 * production-rule tests so each one isolates a single missing value.
 */
const productionBase = () => ({
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://user:pass@db:5432/openprep',
  JWT_SECRET: 'a'.repeat(MIN_SECRET_LENGTH),
  CLIENT_URL: 'https://openprep.ai',
});

describe('config/env', () => {
  describe('normaliseEnv', () => {
    it('trims surrounding whitespace', () => {
      expect(normaliseEnv({ PORT: '  5000  ' }).PORT).toBe('5000');
    });

    it('treats an empty value as unset', () => {
      // `FOO=` in a .env file means "unset", not "the empty string".
      const result = normaliseEnv({ REDIS_URL: '', GEMINI_API_KEY: '   ' });

      expect(result.REDIS_URL).toBeUndefined();
      expect(result.GEMINI_API_KEY).toBeUndefined();
    });

    it('passes non-string values through', () => {
      expect(normaliseEnv({ PORT: 5000 }).PORT).toBe(5000);
    });
  });

  describe('isPlaceholder', () => {
    it('recognises unfilled .env.example values', () => {
      expect(isPlaceholder('your_gemini_api_key_here')).toBe(true);
      expect(isPlaceholder('your_jwt_secret_here')).toBe(true);
      expect(isPlaceholder('changeme')).toBe(true);
      expect(isPlaceholder('CHANGEME')).toBe(true);
      expect(isPlaceholder('placeholder')).toBe(true);
      expect(isPlaceholder('xxxxx')).toBe(true);
      expect(isPlaceholder('<your-key>')).toBe(true);
    });

    it('does not flag real values', () => {
      expect(isPlaceholder('AIzaSyDrealkey123')).toBe(false);
      expect(isPlaceholder('postgres://user:pass@localhost:5432/db')).toBe(false);
      expect(isPlaceholder('a'.repeat(64))).toBe(false);
    });

    it('ignores non-strings', () => {
      expect(isPlaceholder(undefined)).toBe(false);
      expect(isPlaceholder(5000)).toBe(false);
    });

    it('treats a placeholder as unset rather than accepting it', () => {
      // A placeholder that boots successfully is worse than one that fails:
      // SMTP silently sends nowhere and the JWT key becomes a known value.
      const { config } = validateEnv({ GEMINI_API_KEY: 'your_gemini_api_key_here' });

      expect(config.GEMINI_API_KEY).toBeUndefined();
    });
  });

  describe('defaults', () => {
    it('applies documented defaults for an empty environment', () => {
      const { success, config } = validateEnv({});

      expect(success).toBe(true);
      expect(config.NODE_ENV).toBe('development');
      expect(config.PORT).toBe(5000);
      expect(config.JWT_EXPIRE).toBe('15m');
      expect(config.CACHE_TTL).toBe(3600);
      expect(config.CACHE_MAX_KEYS).toBe(1000);
      expect(config.DB_POOL_MAX).toBe(10);
      expect(config.SMTP_PORT).toBe(587);
    });

    it('does not require optional integrations outside production', () => {
      const { success } = validateEnv({ NODE_ENV: 'development' });

      expect(success).toBe(true);
    });
  });

  describe('type coercion', () => {
    it('returns numbers, not strings', () => {
      const { config } = validateEnv({ PORT: '8080', CACHE_TTL: '60', DB_POOL_MAX: '25' });

      expect(config.PORT).toBe(8080);
      expect(config.CACHE_TTL).toBe(60);
      expect(config.DB_POOL_MAX).toBe(25);
    });

    it('rejects a non-numeric value instead of yielding NaN', () => {
      // The current failure mode: parseInt on a typo gives NaN and produces a
      // subtly broken pool rather than an error.
      const { success, errors } = validateEnv({ PORT: 'eighty-eighty' });

      expect(success).toBe(false);
      expect(errors[0].key).toBe('PORT');
      expect(errors[0].message).toMatch(/expected an integer/);
    });

    it('rejects a non-integer number', () => {
      expect(validateEnv({ PORT: '80.5' }).success).toBe(false);
    });

    it('enforces bounds', () => {
      expect(validateEnv({ PORT: '0' }).success).toBe(false);
      expect(validateEnv({ PORT: '70000' }).success).toBe(false);
      expect(validateEnv({ PORT: '65535' }).success).toBe(true);
      expect(validateEnv({ DB_POOL_MAX: '0' }).success).toBe(false);
    });

    it('returns booleans, not strings', () => {
      const { config } = validateEnv({ SMTP_SECURE: 'true' });

      expect(config.SMTP_SECURE).toBe(true);
      expect(typeof config.SMTP_SECURE).toBe('boolean');
    });

    it('parses "false" as false rather than a truthy string', () => {
      // The bug this prevents: `if (process.env.SMTP_SECURE)` is true for "false".
      const { config } = validateEnv({ SMTP_SECURE: 'false' });

      expect(config.SMTP_SECURE).toBe(false);
    });

    it('accepts the common boolean spellings', () => {
      for (const truthy of ['true', 'TRUE', '1', 'yes', 'on']) {
        expect(validateEnv({ SMTP_SECURE: truthy }).config.SMTP_SECURE).toBe(true);
      }
      for (const falsy of ['false', 'FALSE', '0', 'no', 'off']) {
        expect(validateEnv({ SMTP_SECURE: falsy }).config.SMTP_SECURE).toBe(false);
      }
    });

    it('rejects an ambiguous boolean rather than guessing', () => {
      const { success, errors } = validateEnv({ SMTP_SECURE: 'maybe' });

      expect(success).toBe(false);
      expect(errors[0].message).toMatch(/expected a boolean/);
    });
  });

  describe('constrained values', () => {
    it('accepts the known environments', () => {
      for (const nodeEnv of ['development', 'test', 'production']) {
        const source = nodeEnv === 'production' ? productionBase() : { NODE_ENV: nodeEnv };
        expect(validateEnv(source).success).toBe(true);
      }
    });

    it('rejects an unknown NODE_ENV', () => {
      expect(validateEnv({ NODE_ENV: 'staging' }).success).toBe(false);
    });

    it('rejects an unknown LOG_LEVEL', () => {
      expect(validateEnv({ LOG_LEVEL: 'chatty' }).success).toBe(false);
      expect(validateEnv({ LOG_LEVEL: 'debug' }).success).toBe(true);
    });

    it('rejects a malformed URL', () => {
      const { success, errors } = validateEnv({ CLIENT_URL: 'not-a-url' });

      expect(success).toBe(false);
      expect(errors[0].key).toBe('CLIENT_URL');
    });

    it('accepts a well-formed URL', () => {
      expect(validateEnv({ CLIENT_URL: 'https://openprep.ai' }).success).toBe(true);
    });
  });

  describe('production requirements', () => {
    it('accepts a fully configured production environment', () => {
      expect(validateEnv(productionBase()).success).toBe(true);
    });

    it('requires DATABASE_URL', () => {
      const source = productionBase();
      delete source.DATABASE_URL;

      const { success, errors } = validateEnv(source);

      expect(success).toBe(false);
      expect(errors.some((e) => e.key === 'DATABASE_URL')).toBe(true);
    });

    it('requires JWT_SECRET', () => {
      const source = productionBase();
      delete source.JWT_SECRET;

      const { errors } = validateEnv(source);

      expect(errors.some((e) => e.key === 'JWT_SECRET')).toBe(true);
    });

    it('rejects a short JWT_SECRET', () => {
      const { success, errors } = validateEnv({ ...productionBase(), JWT_SECRET: 'short' });

      // Existence alone was the old check, so a one-character secret booted.
      expect(success).toBe(false);
      expect(errors.some((e) => e.message.includes(`${MIN_SECRET_LENGTH} characters`))).toBe(true);
    });

    it('reports a missing JWT_SECRET once, not twice', () => {
      const source = productionBase();
      delete source.JWT_SECRET;

      const { errors } = validateEnv(source);

      expect(errors.filter((e) => e.key === 'JWT_SECRET')).toHaveLength(1);
    });

    it('requires a client origin, in any of its accepted forms', () => {
      const withoutOrigin = productionBase();
      delete withoutOrigin.CLIENT_URL;

      expect(validateEnv(withoutOrigin).success).toBe(false);
      expect(validateEnv({ ...withoutOrigin, CLIENT_ORIGIN: 'https://a.com' }).success).toBe(true);
      expect(validateEnv({ ...withoutOrigin, CORS_ORIGIN: 'https://a.com' }).success).toBe(true);
    });

    it('does not apply production rules in development', () => {
      expect(validateEnv({ NODE_ENV: 'development', JWT_SECRET: 'short' }).success).toBe(true);
    });

    it('does not apply production rules in test', () => {
      expect(validateEnv({ NODE_ENV: 'test' }).success).toBe(true);
    });

    it('rejects a placeholder JWT_SECRET in production', () => {
      const { success } = validateEnv({ ...productionBase(), JWT_SECRET: 'your_jwt_secret_here' });

      expect(success).toBe(false);
    });

    it('collects every problem in one pass', () => {
      // An operator fixing a fresh deployment should see the whole list, not
      // play whack-a-mole across six restarts.
      const { errors } = validateEnv({ NODE_ENV: 'production' });

      expect(errors.length).toBeGreaterThanOrEqual(3);
      expect(errors.some((e) => e.key === 'DATABASE_URL')).toBe(true);
      expect(errors.some((e) => e.key === 'JWT_SECRET')).toBe(true);
      expect(errors.some((e) => e.key === 'CLIENT_URL')).toBe(true);
    });
  });

  describe('formatErrors', () => {
    it('renders a readable block with hints', () => {
      const output = formatErrors([
        { key: 'JWT_SECRET', message: 'is required', hint: 'openssl rand -hex 32' },
        { key: 'PORT', message: 'expected an integer' },
      ]);

      expect(output).toContain('Environment configuration is invalid');
      expect(output).toContain('JWT_SECRET: is required');
      expect(output).toContain('openssl rand -hex 32');
      expect(output).toContain('PORT: expected an integer');
      expect(output).toContain('.env.example');
    });
  });

  describe('summariseIntegrations', () => {
    it('reports which optional integrations are configured', () => {
      const { config } = validateEnv({
        REDIS_URL: 'redis://localhost:6379',
        GEMINI_API_KEY: 'real-key',
      });

      const summary = summariseIntegrations(config);

      expect(summary.redis).toBe('enabled');
      expect(summary.gemini).toBe('enabled');
      expect(summary.smtp).toBe('disabled');
      expect(summary.googleOAuth).toBe('disabled');
    });

    it('requires both halves of a credential pair', () => {
      const { config } = validateEnv({ GOOGLE_CLIENT_ID: 'id-only' });

      expect(summariseIntegrations(config).googleOAuth).toBe('disabled');
    });

    it('never exposes the values themselves', () => {
      const { config } = validateEnv({
        REDIS_URL: 'redis://:supersecret@localhost:6379',
        GEMINI_API_KEY: 'AIzaSy-secret',
      });

      const serialised = JSON.stringify(summariseIntegrations(config));

      expect(serialised).not.toContain('supersecret');
      expect(serialised).not.toContain('AIzaSy-secret');
    });
  });

  describe('loadEnv', () => {
    const silentLogger = () => ({ error: vi.fn(), warn: vi.fn(), log: vi.fn() });

    it('returns a frozen config on success', () => {
      const logger = silentLogger();
      const config = loadEnv({ NODE_ENV: 'development' }, { logger, onExit: vi.fn() });

      expect(Object.isFrozen(config)).toBe(true);
      expect(() => {
        config.PORT = 9999;
      }).toThrow();
    });

    it('exits in production when the environment is invalid', () => {
      const onExit = vi.fn();
      const logger = silentLogger();

      loadEnv({ NODE_ENV: 'production' }, { logger, onExit });

      expect(onExit).toHaveBeenCalledWith(1);
      expect(logger.error).toHaveBeenCalledOnce();
      expect(logger.error.mock.calls[0][0]).toContain('JWT_SECRET');
    });

    it('does not exit in production when the environment is valid', () => {
      const onExit = vi.fn();

      loadEnv(productionBase(), { logger: silentLogger(), onExit });

      expect(onExit).not.toHaveBeenCalled();
    });

    it('warns and continues in development', () => {
      const onExit = vi.fn();
      const logger = silentLogger();

      // A frontend contributor with a half-filled .env should still get an
      // API to talk to.
      const config = loadEnv({ NODE_ENV: 'development', PORT: 'nonsense' }, { logger, onExit });

      expect(onExit).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
      expect(config).toBeNull();
    });

    it('never exits under test', () => {
      const onExit = vi.fn();

      // A hard exit inside the test runner kills the run and hides the real
      // assertion failure.
      loadEnv({ NODE_ENV: 'test', SMTP_SECURE: 'maybe' }, { logger: silentLogger(), onExit });

      expect(onExit).not.toHaveBeenCalled();
    });
  });
});

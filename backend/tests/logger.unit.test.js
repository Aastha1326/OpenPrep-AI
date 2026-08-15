const path = require('path');

const LOGGER_PATH = path.join(__dirname, '..', 'utils', 'logger.js');

/**
 * The logger reads NODE_ENV / LOG_LEVEL at call time (not import time) so it
 * can be reconfigured per test, but the module itself is cached — reload it
 * fresh in each suite that pokes at module-level behaviour.
 */
const loadLogger = () => {
  delete require.cache[require.resolve(LOGGER_PATH)];
  return require(LOGGER_PATH);
};

describe('utils/logger', () => {
  const originalEnv = { ...process.env };
  let stdout;
  let stderr;

  beforeEach(() => {
    stdout = [];
    stderr = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdout.push(String(chunk));
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      stderr.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('level resolution', () => {
    it('is silent under NODE_ENV=test so vitest output stays readable', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.LOG_LEVEL;
      const logger = loadLogger();

      logger.error('should not appear');
      logger.info('should not appear either');

      expect(logger.getLevel()).toBe('silent');
      expect(stdout).toHaveLength(0);
      expect(stderr).toHaveLength(0);
    });

    it('defaults to info in production and debug in development', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_LEVEL;
      expect(loadLogger().getLevel()).toBe('info');

      process.env.NODE_ENV = 'development';
      expect(loadLogger().getLevel()).toBe('debug');
    });

    it('honours an explicit LOG_LEVEL over the NODE_ENV default', () => {
      process.env.NODE_ENV = 'test';
      process.env.LOG_LEVEL = 'warn';
      const logger = loadLogger();

      expect(logger.getLevel()).toBe('warn');
    });

    it('suppresses messages below the active level', () => {
      process.env.NODE_ENV = 'development';
      process.env.LOG_LEVEL = 'warn';
      const logger = loadLogger();

      logger.error('kept');
      logger.warn('kept');
      logger.info('dropped');
      logger.debug('dropped');

      expect(stderr.join('')).toContain('kept');
      expect(stdout.join('')).toBe('');
    });

    it('ignores an unrecognised LOG_LEVEL rather than throwing', () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'chatty';
      const logger = loadLogger();

      expect(logger.getLevel()).toBe('info');
    });
  });

  describe('output format', () => {
    it('writes one JSON object per line in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'info';
      const logger = loadLogger();

      logger.info('request completed', { status: 200, durationMs: 12.5 });

      expect(stdout).toHaveLength(1);
      expect(stdout[0].endsWith('\n')).toBe(true);

      const parsed = JSON.parse(stdout[0]);
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('request completed');
      expect(parsed.status).toBe(200);
      expect(parsed.durationMs).toBe(12.5);
      expect(typeof parsed.time).toBe('string');
    });

    it('routes error and warn to stderr, info and debug to stdout', () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'debug';
      const logger = loadLogger();

      logger.error('boom');
      logger.warn('careful');
      logger.info('fyi');
      logger.debug('details');

      expect(stderr).toHaveLength(2);
      expect(stdout).toHaveLength(2);
    });

    it('writes human-readable lines outside production', () => {
      process.env.NODE_ENV = 'development';
      process.env.LOG_LEVEL = 'info';
      const logger = loadLogger();

      logger.info('server started', { port: 5000 });

      const line = stdout[0];
      expect(line).toContain('INFO');
      expect(line).toContain('server started');
      expect(line).toContain('port=5000');
      expect(() => JSON.parse(line)).toThrow();
    });
  });

  describe('redaction', () => {
    let logger;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'debug';
      logger = loadLogger();
    });

    it('redacts known sensitive keys', () => {
      const result = logger.redact({
        email: 'student@example.com',
        password: 'hunter2',
        refreshToken: 'eyJhbGciOi...',
        apiKey: 'sk-live-123',
      });

      expect(result.email).toBe('student@example.com');
      expect(result.password).toBe('[REDACTED]');
      expect(result.refreshToken).toBe('[REDACTED]');
      expect(result.apiKey).toBe('[REDACTED]');
    });

    it('matches keys case-insensitively and ignores separators', () => {
      expect(logger.isSensitiveKey('Password')).toBe(true);
      expect(logger.isSensitiveKey('REFRESH_TOKEN')).toBe(true);
      expect(logger.isSensitiveKey('x-refresh-token')).toBe(true);
      expect(logger.isSensitiveKey('googleRefreshTokenEncrypted')).toBe(true);
      expect(logger.isSensitiveKey('username')).toBe(false);
      expect(logger.isSensitiveKey('tokenCount')).toBe(true);
    });

    it('redacts nested objects and objects inside arrays', () => {
      const result = logger.redact({
        user: { id: 7, profile: { password: 'nested' } },
        sessions: [{ sessionId: 'abc' }, { sessionId: 'def' }],
      });

      expect(result.user.id).toBe(7);
      expect(result.user.profile.password).toBe('[REDACTED]');
      expect(result.sessions[0].sessionId).toBe('[REDACTED]');
      expect(result.sessions[1].sessionId).toBe('[REDACTED]');
    });

    it('survives circular references', () => {
      const node = { name: 'req' };
      node.self = node;
      node.children = [node];

      const result = logger.redact(node);

      expect(result.name).toBe('req');
      expect(result.self).toBe('[Circular]');
      expect(result.children[0]).toBe('[Circular]');
    });

    it('caps recursion depth instead of walking forever', () => {
      let deep = { value: 'bottom' };
      for (let i = 0; i < 20; i += 1) {
        deep = { nested: deep };
      }

      const result = logger.redact(deep);
      const serialised = JSON.stringify(result);

      expect(serialised).toContain('[Object]');
      expect(serialised).not.toContain('bottom');
    });

    it('truncates very long strings and very long arrays', () => {
      const result = logger.redact({
        blob: 'x'.repeat(5000),
        rows: Array.from({ length: 200 }, (_, i) => i),
      });

      expect(result.blob).toContain('[truncated');
      expect(result.blob.length).toBeLessThan(5000);
      expect(result.rows).toHaveLength(51);
      expect(result.rows[50]).toContain('more items');
    });

    it('serialises Error objects with a bounded stack', () => {
      const err = new Error('database is down');
      err.statusCode = 503;
      err.code = 'ECONNREFUSED';

      const result = logger.redact({ err });

      expect(result.err.name).toBe('Error');
      expect(result.err.message).toBe('database is down');
      expect(result.err.statusCode).toBe(503);
      expect(result.err.code).toBe('ECONNREFUSED');
      expect(result.err.stack.split('\n').length).toBeLessThanOrEqual(12);
    });

    it('unwraps Sequelize dataValues and redacts the columns inside', () => {
      const instance = {
        _previousDataValues: { password: 'leaky' },
        dataValues: { id: 3, email: 'a@b.com', password: 'super-secret-hash' },
      };

      const result = logger.redact({ user: instance });

      expect(result.user.id).toBe(3);
      expect(result.user.email).toBe('a@b.com');
      expect(result.user.password).toBe('[REDACTED]');
      expect(result.user._previousDataValues).toBeUndefined();
    });

    it('redacts before writing, not after', () => {
      logger.error('auth failed', { authorization: 'Bearer eyJleak' });

      const line = stderr.join('');
      expect(line).not.toContain('eyJleak');
      expect(line).toContain('[REDACTED]');
    });

    it('leaves null and undefined alone', () => {
      const result = logger.redact({ a: null, b: undefined, c: 0, d: false });
      expect(result.a).toBeNull();
      expect(result.b).toBeUndefined();
      expect(result.c).toBe(0);
      expect(result.d).toBe(false);
    });
  });

  describe('child loggers', () => {
    it('merges bound metadata into every call', () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'info';
      const logger = loadLogger();

      const scoped = logger.child({ requestId: 'req-123' });
      scoped.info('request completed', { status: 204 });

      const parsed = JSON.parse(stdout[0]);
      expect(parsed.requestId).toBe('req-123');
      expect(parsed.status).toBe(204);
    });

    it('lets per-call metadata override the bound value', () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'info';
      const logger = loadLogger();

      logger.child({ scope: 'outer' }).info('msg', { scope: 'inner' });

      expect(JSON.parse(stdout[0]).scope).toBe('inner');
    });

    it('nests further via child()', () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'info';
      const logger = loadLogger();

      logger.child({ requestId: 'r1' }).child({ service: 'gemini' }).info('call finished');

      const parsed = JSON.parse(stdout[0]);
      expect(parsed.requestId).toBe('r1');
      expect(parsed.service).toBe('gemini');
    });
  });
});

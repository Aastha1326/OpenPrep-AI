const { EventEmitter } = require('events');
const path = require('path');

const REQUEST_LOGGER_PATH = path.join(__dirname, '..', 'middleware', 'requestLogger.js');
const LOGGER_PATH = path.join(__dirname, '..', 'utils', 'logger.js');

/**
 * Minimal Express request/response doubles. The middleware only touches
 * headers, path, method and the response lifecycle events, so a pair of
 * EventEmitters is enough and keeps the test free of supertest/app wiring.
 */
const makeReq = (overrides = {}) => ({
  method: 'GET',
  path: '/api/flashcards',
  originalUrl: '/api/flashcards',
  headers: {},
  ...overrides,
});

const makeRes = (overrides = {}) => {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.writableEnded = false;
  res.headers = {};
  res.setHeader = (name, value) => {
    res.headers[name] = value;
  };
  Object.assign(res, overrides);
  return res;
};

describe('middleware/requestLogger', () => {
  const originalEnv = { ...process.env };
  let requestLogger;
  let logger;
  let lines;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'debug';

    delete require.cache[require.resolve(LOGGER_PATH)];
    delete require.cache[require.resolve(REQUEST_LOGGER_PATH)];
    logger = require(LOGGER_PATH);
    requestLogger = require(REQUEST_LOGGER_PATH);

    lines = [];
    const capture = (chunk) => {
      lines.push(JSON.parse(String(chunk)));
      return true;
    };
    vi.spyOn(process.stdout, 'write').mockImplementation(capture);
    vi.spyOn(process.stderr, 'write').mockImplementation(capture);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('correlation id', () => {
    it('generates an id, exposes it on req.id and echoes it in the response header', () => {
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn();

      requestLogger()(req, res, next);

      expect(typeof req.id).toBe('string');
      expect(req.id.length).toBeGreaterThan(8);
      expect(res.headers['X-Request-Id']).toBe(req.id);
      expect(next).toHaveBeenCalledOnce();
    });

    it('reuses a well-formed inbound X-Request-Id so upstream traces survive', () => {
      const req = makeReq({ headers: { 'x-request-id': 'edge-abc-123' } });
      const res = makeRes();

      requestLogger()(req, res, vi.fn());

      expect(req.id).toBe('edge-abc-123');
    });

    it('generates a fresh id instead of trusting a malformed inbound header', () => {
      const cases = [
        'has spaces',
        'newline\ninjected',
        'x'.repeat(200),
        '',
        '   ',
        '{"json":"payload"}',
      ];

      for (const value of cases) {
        const req = makeReq({ headers: { 'x-request-id': value } });
        requestLogger()(req, makeRes(), vi.fn());
        expect(req.id).not.toBe(value);
      }
    });

    it('attaches a bound child logger as req.log', () => {
      const req = makeReq();
      requestLogger()(req, makeRes(), vi.fn());

      req.log.info('controller message');

      expect(lines[0].requestId).toBe(req.id);
      expect(lines[0].message).toBe('controller message');
    });

    it('exposes sanitiseInboundId for reuse', () => {
      expect(requestLogger.sanitiseInboundId('abc-123')).toBe('abc-123');
      expect(requestLogger.sanitiseInboundId('bad value')).toBeNull();
      expect(requestLogger.sanitiseInboundId(undefined)).toBeNull();
      expect(requestLogger.sanitiseInboundId(42)).toBeNull();
    });
  });

  describe('access logging', () => {
    it('logs one completion line with method, path, status and duration', () => {
      const req = makeReq({ method: 'POST', originalUrl: '/api/quizzes/submit' });
      const res = makeRes({ statusCode: 201 });

      requestLogger()(req, res, vi.fn());
      res.writableEnded = true;
      res.emit('finish');

      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({
        message: 'request completed',
        method: 'POST',
        path: '/api/quizzes/submit',
        status: 201,
        requestId: req.id,
      });
      expect(typeof lines[0].durationMs).toBe('number');
    });

    it('strips the query string so tokens in query params never reach the log', () => {
      const req = makeReq({ originalUrl: '/api/auth/callback?code=secret-code&state=xyz' });
      const res = makeRes();

      requestLogger()(req, res, vi.fn());
      res.writableEnded = true;
      res.emit('finish');

      expect(lines[0].path).toBe('/api/auth/callback');
      expect(JSON.stringify(lines[0])).not.toContain('secret-code');
    });

    it('includes the user id once the request is authenticated', () => {
      const req = makeReq();
      const res = makeRes();

      requestLogger()(req, res, vi.fn());
      req.user = { id: 'user-42', email: 'a@b.com' };
      res.writableEnded = true;
      res.emit('finish');

      expect(lines[0].userId).toBe('user-42');
    });

    it('escalates the level with the status code', () => {
      expect(requestLogger.levelForStatus(200)).toBe('info');
      expect(requestLogger.levelForStatus(302)).toBe('info');
      expect(requestLogger.levelForStatus(404)).toBe('warn');
      expect(requestLogger.levelForStatus(422)).toBe('warn');
      expect(requestLogger.levelForStatus(500)).toBe('error');
      expect(requestLogger.levelForStatus(503)).toBe('error');
    });

    it('flags requests slower than the configured threshold', () => {
      const req = makeReq();
      const res = makeRes();

      requestLogger({ slowRequestMs: -1 })(req, res, vi.fn());
      res.writableEnded = true;
      res.emit('finish');

      expect(lines[0].slow).toBe(true);
    });

    it('does not flag a fast request', () => {
      const req = makeReq();
      const res = makeRes();

      requestLogger({ slowRequestMs: 10000 })(req, res, vi.fn());
      res.writableEnded = true;
      res.emit('finish');

      expect(lines[0].slow).toBeUndefined();
    });

    it('logs an aborted request when the client hangs up mid-response', () => {
      const req = makeReq();
      const res = makeRes();

      requestLogger()(req, res, vi.fn());
      res.emit('close'); // writableEnded stays false

      expect(lines).toHaveLength(1);
      expect(lines[0].message).toBe('request aborted');
      expect(lines[0].aborted).toBe(true);
      expect(lines[0].level).toBe('warn');
    });

    it('logs exactly once when close follows finish on a healthy response', () => {
      const req = makeReq();
      const res = makeRes();

      requestLogger()(req, res, vi.fn());
      res.writableEnded = true;
      res.emit('finish');
      res.emit('close');

      expect(lines).toHaveLength(1);
      expect(lines[0].message).toBe('request completed');
    });
  });

  describe('skip list', () => {
    it('skips health probes and static avatars by default', () => {
      for (const skipped of ['/healthz', '/api/health', '/api/v1/health', '/uploads/avatars/a.png']) {
        const req = makeReq({ path: skipped, originalUrl: skipped });
        const res = makeRes();

        requestLogger()(req, res, vi.fn());
        res.writableEnded = true;
        res.emit('finish');
      }

      expect(lines).toHaveLength(0);
    });

    it('still assigns a correlation id to skipped paths', () => {
      const req = makeReq({ path: '/healthz', originalUrl: '/healthz' });
      const res = makeRes();

      requestLogger()(req, res, vi.fn());

      expect(req.id).toBeTruthy();
      expect(res.headers['X-Request-Id']).toBe(req.id);
    });

    it('accepts a custom skip list', () => {
      const req = makeReq({ path: '/api/metrics', originalUrl: '/api/metrics' });
      const res = makeRes();

      requestLogger({ skipPaths: ['/api/metrics'] })(req, res, vi.fn());
      res.writableEnded = true;
      res.emit('finish');

      expect(lines).toHaveLength(0);
    });

    it('does not skip a path that merely shares a prefix segment', () => {
      const req = makeReq({ path: '/healthzzz', originalUrl: '/healthzzz' });
      const res = makeRes();

      requestLogger()(req, res, vi.fn());
      res.writableEnded = true;
      res.emit('finish');

      expect(lines).toHaveLength(1);
    });
  });
});

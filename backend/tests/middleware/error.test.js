const errorHandler = require('../../middleware/error');

describe('Error Handler Middleware', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      statusCode: null,
      body: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.body = data;
        return this;
      },
    };
  });

  it('should return 500 for a generic error', () => {
    const err = new Error('Something went wrong');
    errorHandler(err, req, res, vi.fn());

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: 'Something went wrong',
    });
  });

  it('should return 400 for a SequelizeValidationError', () => {
    const err = new Error('Validation failed');
    err.name = 'SequelizeValidationError';
    err.errors = [
      { message: 'Email is required' },
      { message: 'Password must be at least 8 characters' },
    ];
    errorHandler(err, req, res, vi.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: 'Email is required, Password must be at least 8 characters',
    });
  });

  it('should return 400 for a SequelizeUniqueConstraintError', () => {
    const err = new Error('unique constraint violated');
    err.name = 'SequelizeUniqueConstraintError';
    err.errors = [
      { path: 'email', message: 'email must be unique' },
    ];
    errorHandler(err, req, res, vi.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: 'Duplicate value for field: email',
    });
  });

  it('should return 404 for a SequelizeForeignKeyConstraintError', () => {
    const err = new Error('foreign key constraint fails');
    err.name = 'SequelizeForeignKeyConstraintError';
    errorHandler(err, req, res, vi.fn());

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: 'Referenced resource not found',
    });
  });

  it('should return 400 for a SequelizeDatabaseError', () => {
    const err = new Error('invalid input syntax for type uuid');
    err.name = 'SequelizeDatabaseError';
    errorHandler(err, req, res, vi.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: 'Invalid request',
    });
  });

  it('should return 400 for a SequelizeEagerLoadingError', () => {
    const err = new Error('include not found');
    err.name = 'SequelizeEagerLoadingError';
    errorHandler(err, req, res, vi.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: 'Invalid query configuration',
    });
  });

  it('should preserve an existing statusCode if set on the error', () => {
    const err = new Error('Custom error');
    err.statusCode = 429;
    errorHandler(err, req, res, vi.fn());

    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({
      success: false,
      error: 'Custom error',
    });
  });

  it('should return 408 for a timeout error', () => {
    const err = new Error('Gemini request timed out');
    err.statusCode = 408;
    errorHandler(err, req, res, vi.fn());

    expect(res.statusCode).toBe(408);
    expect(res.body).toEqual({
      success: false,
      error: 'Gemini request timed out',
    });
  });
  it('should capture 500 errors in Sentry when Sentry is enabled and set user/request scope', () => {
    const sentryConfig = require('../../config/sentry');
    const originalReady = sentryConfig.isSentryReady;
    sentryConfig.isSentryReady = true;

    const mockScope = {
      setUser: vi.fn(),
      setTag: vi.fn(),
      setExtra: vi.fn(),
    };

    const originalWithScope = sentryConfig.Sentry.withScope;
    const originalCapture = sentryConfig.Sentry.captureException;

    sentryConfig.Sentry.withScope = vi.fn().mockImplementation((callback) => {
      callback(mockScope);
    });
    sentryConfig.Sentry.captureException = vi.fn();

    req.user = { id: 'user_123', email: 'test@example.com' };
    req.method = 'POST';
    req.originalUrl = '/api/some-route';
    req.id = 'req_abc';

    const err = new Error('Internal system crash');
    errorHandler(err, req, res, vi.fn());

    expect(sentryConfig.Sentry.withScope).toHaveBeenCalled();
    expect(mockScope.setUser).toHaveBeenCalledWith({ id: 'user_123', email: 'test@example.com' });
    expect(mockScope.setTag).toHaveBeenCalledWith('method', 'POST');
    expect(mockScope.setTag).toHaveBeenCalledWith('url', '/api/some-route');
    expect(mockScope.setExtra).toHaveBeenCalledWith('requestId', 'req_abc');
    expect(sentryConfig.Sentry.captureException).toHaveBeenCalledWith(err);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal Server Error');

    // Restore
    sentryConfig.isSentryReady = originalReady;
    sentryConfig.Sentry.withScope = originalWithScope;
    sentryConfig.Sentry.captureException = originalCapture;
  });
});

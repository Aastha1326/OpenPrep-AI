const { doubleCsrf } = require('csrf-csrf');

const doubleCsrfOptions = {
  getSecret: () => process.env.CSRF_SECRET || 'super_secret_csrf_key_12345!',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token'] || req.body?._csrf,
};

const {
  invalidCsrfTokenError,
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf(doubleCsrfOptions);

// Custom CSRF error handler middleware
const csrfErrorHandler = (err, req, res, next) => {
  if (err && err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      error: 'Invalid or missing CSRF token',
    });
  }
  next(err);
};

module.exports = {
  doubleCsrfProtection,
  generateCsrfToken,
  csrfErrorHandler,
};

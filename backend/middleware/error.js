const logger = require('../utils/logger');
const { Sentry, isSentryReady } = require('../config/sentry');

/**
 * Attach the correlation ID to an error payload so a user can quote it in a
 * bug report and a maintainer can grep straight to the failing request.
 * Omitted entirely when no ID is present, so response shapes asserted by
 * existing tests are unchanged.
 */
const withRequestId = (req, body) => (req && req.id ? { ...body, requestId: req.id } : body);

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || err.status;

  // Log through the structured logger rather than console.error: the entry
  // carries the request correlation ID, and sensitive fields (SQL parameters
  // on Sequelize errors, auth headers) are redacted before they reach stdout.
  const log = (req && req.log) || logger;
  const loggedStatus = error.statusCode || 500;
  log[loggedStatus >= 500 ? 'error' : 'warn']('request failed', {
    requestId: req && req.id,
    method: req && req.method,
    path: req && (req.originalUrl ? req.originalUrl.split('?')[0] : req.path),
    status: loggedStatus,
    err,
  });

  // Sequelize validation error — model-level validation failures
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map((val) => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }

  // Sequelize unique constraint violation — duplicate field value
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map((e) => e.path).join(', ');
    error = new Error(`Duplicate value for field: ${fields}`);
    error.statusCode = 400;
  }

  // Sequelize foreign key constraint — referenced resource does not exist
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = new Error('Referenced resource not found');
    error.statusCode = 404;
  }

  // Sequelize database error — invalid UUIDs, bad SQL, type mismatches
  if (err.name === 'SequelizeDatabaseError') {
    error = new Error('Invalid request');
    error.statusCode = 400;
  }

  // Sequelize eager loading error — invalid include options
  if (err.name === 'SequelizeEagerLoadingError') {
    error = new Error('Invalid query configuration');
    error.statusCode = 400;
  }

  // Multer file size limit error
if (err.name === 'MulterError') {
  if (err.code === 'LIMIT_FILE_SIZE') {
    const isAudioUpload = req.path.includes('/flashcards/from-audio');

    return res.status(400).json(
      withRequestId(req, {
        success: false,
        error: isAudioUpload
          ? 'Audio file too large. Maximum allowed size is 25MB.'
          : 'File too large. Maximum allowed size is 15MB.',
      })
    );
  }    error = new Error(err.message);
    error.statusCode = 400;
  }

  // Custom file type validation error
  if (err.name === 'FileValidationError') {
    error.statusCode = 400;
  }

  // JWT Errors
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      withRequestId(req, {
        success: false,
        message: 'Token expired',
        error: 'Token expired',
      })
    );
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      withRequestId(req, {
        success: false,
        message: 'Invalid token',
        error: 'Not authorized to access this route',
      })
    );
  }

  // Timeout error handling
  if (err.statusCode === 408 || err.message?.includes('timed out')) {
    error.statusCode = 408;
    error.message = err.message || 'Request processing timed out. Please try again with a smaller file.';
  }

  const statusCode = error.statusCode || 500;

  if (isSentryReady && statusCode >= 500) {
    if (req.user) {
      Sentry.setUser({ id: req.user.id, email: req.user.email });
    }
    Sentry.captureException(err);
  }

  const responseMessage = statusCode === 500 ? 'Internal Server Error' : (error.message || 'Server Error');

  res.status(statusCode).json(
    withRequestId(req, {
      success: false,
      error: responseMessage,
      message: responseMessage,
    })
  );
};

module.exports = errorHandler;
module.exports.withRequestId = withRequestId;

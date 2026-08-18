const { Sentry, isSentryReady } = require('../config/sentry');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for developer
  console.error(err);

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

  // Custom file type validation error
  if (err.name === 'FileValidationError') {
    error.statusCode = 400;
  }

  // Timeout error handling
  if (err.statusCode === 408 || err.message?.includes('timed out')) {
    error.statusCode = 408;
    error.message = err.message || 'Request processing timed out. Please try again with a smaller file.';
  }

  const statusCode = error.statusCode || 500;

  if (isSentryReady && statusCode >= 500) {
    Sentry.withScope((scope) => {
      if (req.user) {
        scope.setUser({ id: req.user.id, email: req.user.email });
      }
      if (req) {
        scope.setTag('method', req.method);
        scope.setTag('url', req.originalUrl || req.url);
        scope.setExtra('requestId', req.id);
      }
      Sentry.captureException(err);
    });
  }

  const responseMessage = statusCode === 500 ? 'Internal Server Error' : (error.message || 'Server Error');

  res.status(statusCode).json({
    success: false,
    error: responseMessage,
  });
};

module.exports = errorHandler;

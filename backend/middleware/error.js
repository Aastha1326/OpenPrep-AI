const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || err.status;

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

  // Multer file size limit error
if (err.name === 'MulterError') {
  if (err.code === 'LIMIT_FILE_SIZE') {
    const isAudioUpload = req.path.includes('/flashcards/from-audio');

    return res.status(400).json({
      success: false,
      error: isAudioUpload
        ? 'Audio file too large. Maximum allowed size is 25MB.'
        : 'File too large. Maximum allowed size is 15MB.',
    });
  }    error = new Error(err.message);
    error.statusCode = 400;
  }

  // Custom file type validation error
  if (err.name === 'FileValidationError') {
    error.statusCode = 400;
  }

  // JWT Errors
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'Token expired',
    });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'Not authorized to access this route',
    });
  }

  // Timeout error handling
  if (err.statusCode === 408 || err.message?.includes('timed out')) {
    error.statusCode = 408;
    error.message = err.message || 'Request processing timed out. Please try again with a smaller file.';
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};

module.exports = errorHandler;

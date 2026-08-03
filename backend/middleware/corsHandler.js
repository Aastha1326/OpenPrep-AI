const cors = require('cors');

const buildAllowedOrigins = () => {
  const origins = new Set();
  
  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(',').forEach((url) => {
      origins.add(url.trim().replace(/\/$/, ''));
    });
  }
  
  if (process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN.split(',').forEach((url) => {
      origins.add(url.trim().replace(/\/$/, ''));
    });
  }

  // Fallback to local dev server if no whitelist is specified
  if (origins.size === 0) {
    origins.add('http://localhost:5173');
  }

  return origins;
};

const getCorsMiddleware = () => {
  const allowedOrigins = buildAllowedOrigins();

  const corsOptionsDelegate = (req, callback) => {
    const origin = req.header('Origin');
    
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      return callback(null, { origin: true, credentials: true });
    }

    if (allowedOrigins.has(origin)) {
      callback(null, { origin: true, credentials: true });
    } else {
      const error = new Error('Not allowed by CORS');
      error.statusCode = 403;
      error.status = 403;
      callback(error);
    }
  };

  return cors(corsOptionsDelegate);
};

module.exports = {
  getCorsMiddleware,
  buildAllowedOrigins,
};

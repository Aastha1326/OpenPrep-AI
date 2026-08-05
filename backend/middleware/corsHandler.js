const cors = require('cors');

const buildAllowedOrigins = () => {
  const origins = new Set();

  if (process.env.CLIENT_ORIGIN) {
    process.env.CLIENT_ORIGIN.split(',').forEach((url) => {
      origins.add(url.trim().replace(/\/$/, ''));
    });
  }

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

    const baseOptions = {
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      optionsSuccessStatus: 204,
    };

    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      return callback(null, { ...baseOptions, origin: true });
    }

    if (allowedOrigins.has(origin)) {
      callback(null, { ...baseOptions, origin: true });
    } else {
      const error = new Error('Not allowed by CORS');
      error.statusCode = 403;
      error.status = 403;
      callback(error);
    }
  };

  return cors(corsOptionsDelegate);
};

// Origin validator in the shape Socket.IO's `cors.origin` option expects,
// so the same whitelist protects WebSocket connections.
const getSocketCorsOrigin = () => {
  const allowedOrigins = buildAllowedOrigins();

  return (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  };
};

module.exports = {
  getCorsMiddleware,
  getSocketCorsOrigin,
  buildAllowedOrigins,
};
require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/error');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { protect } = require('./middleware/auth');
const fs = require('fs');
const PYQ = require('./models/PYQ');
const Note = require('./models/Note');
const Achievement = require('./models/Achievement');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const passport = require('./config/passport');
const { getCorsMiddleware, getSocketCorsOrigin } = require('./middleware/corsHandler');

// Validate the whole environment against the schema in config/env.js before
// anything else loads. Reports every problem at once and exits in production;
// in development it warns and continues on defaults so the API still boots.
//
// This supersedes the ad-hoc JWT_SECRET / GEMINI_API_KEY guards that used to
// live here: both are declared in the schema now, JWT_SECRET is additionally
// length-checked in production, and GEMINI_API_KEY surfaces through the
// integration summary below. Reported through the structured logger so the
// startup report lands in the same stream as every other log line.
const { loadEnv, summariseIntegrations } = require('./config/env');

const env = loadEnv(process.env, { logger });

logger.info('configuration loaded', {
  env: env.NODE_ENV,
  integrations: summariseIntegrations(env),
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const academicRoutes = require('./routes/academicRoutes');
const pyqRoutes = require('./routes/pyqRoutes');
const studyPlanRoutes = require('./routes/studyPlanRoutes');
const quizRoutes = require('./routes/quizRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const noteRoutes = require('./routes/noteRoutes');
const progressRoutes = require('./routes/progressRoutes');
const communityRoutes = require('./routes/communityRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const fatigueRoutes = require('./routes/fatigueRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const syncRoutes = require('./routes/syncRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const battleRoutes = require('./routes/battleRoutes');
const { initNotificationCron } = require('./services/notificationService');
const { initDifficultyCalibratorCron } = require('./services/difficultyCalibrator');
initNotificationCron();
initDifficultyCalibratorCron();

// Connect to Database
connectDB();

// Connect to Redis
const redisService = require('./services/redisService');
redisService.connect();

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Mounted first so every request — including ones rejected by CORS, CSRF or
// the rate limiters below — carries a correlation ID and gets an access log
// line. Health probes and static avatars are skipped by default.
app.use(requestLogger());

// Security Middlewares
// Directives shared by every response. Gemini calls happen server-side (see
// services/geminiService.js) but the API host is still explicitly
// allow-listed here in case a client ever needs to reach it directly.
const baseCspDirectives = {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: ["'self'", 'https://generativelanguage.googleapis.com'],
  fontSrc: ["'self'", 'https:', 'data:', 'https://fonts.gstatic.com'],
  objectSrc: ["'none'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: [],
};

const hstsOptions = {
  maxAge: 63072000, // 2 years
  includeSubDomains: true,
  preload: true,
};

// Strict CSP for every route: no 'unsafe-inline' in script-src, which is
// what security-header scanners (e.g. Mozilla Observatory) require for a
// Grade A score.
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      ...baseCspDirectives,
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
    },
  },
  hsts: hstsOptions,
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
});

// swagger-ui-express renders its page with an inline bootstrap <script>, so
// /api-docs needs 'unsafe-inline' in script-src or the docs page breaks.
// Every other route keeps the strict policy above.
const docsSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      ...baseCspDirectives,
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    },
  },
  hsts: hstsOptions,
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs')) {
    return docsSecurityHeaders(req, res, next);
  }
  return securityHeaders(req, res, next);
});app.use(getCorsMiddleware());
app.use(passport.initialize());

// Cookie parser (required for csurf cookie-based tokens)
app.use(cookieParser());

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });
// The batched quiz-telemetry endpoint is flushed via navigator.sendBeacon()
// on tab close/navigation, which cannot attach a CSRF header. It's already
// protected by its own JWT-based auth (see middleware/telemetryAuth.js), so
// CSRF protection is skipped only for this one route.
app.use((req, res, next) => {
  if (req.path === '/api/quiz/telemetry/batch' || req.path === '/api/quizzes/telemetry/batch') {
    return next();
  }
  return csrfProtection(req, res, next);
});
// CSRF Token Endpoint for frontend clients
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Response compression (skip binary uploads via default filter)
app.use(compression({
  level: 6, // balanced gzip compression
  threshold: 0,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Mount Redis-backed distributed rate limiters
const { authRateLimiter, aiRateLimiter, standardGetRateLimiter } = require('./middleware/redisRateLimiter');
app.use('/api/auth', authRateLimiter);
app.use('/api/ai', aiRateLimiter);
app.use('/api', (req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/auth') && !req.path.startsWith('/ai')) {
    return standardGetRateLimiter(req, res, next);
  }
  next();
});

// General API rate limiter: 100 requests per 15 minutes per IP
// Auth routes have tighter per-route limits defined in authRoutes.js
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Serve avatar images publicly — profile pictures are displayed to other
// users (e.g. in community features) and aren't sensitive like notes/PYQs.
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars'), {
  maxAge: '1y',
  immutable: true
}));

// Set Static Folder for File Uploads (Protected)
// protect, Note, PYQ already imported at top of file

app.get('/uploads/:filename', protect, async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const fileUrl = `/uploads/${filename}`;

    let record = await Note.findOne({ where: { fileUrl } });
    let isPublic = false;
    let owner = null;

    if (record) {
      isPublic = record.isPublic;
      owner = record.user;
    } else {
      record = await PYQ.findOne({ where: { fileUrl } });
      if (record) {
        owner = record.user;
      }
    }

    if (!record) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    if (owner !== req.user.id && !isPublic) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this file' });
    }

    res.set('Cache-Control', 'private, max-age=86400'); // 1 day cache for protected assets
    res.sendFile(path.join(__dirname, 'uploads', filename));
  } catch (error) {
    next(error);
  }
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/pyqs', pyqRoutes);
app.use('/api/pyq', pyqRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/study', fatigueRoutes);
app.use('/api/documents', pdfRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/users', userRoutes);
app.get('/api/user/quota', protect, require('./controllers/userController').getQuota);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/battles', battleRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to OpenPrep AI Backend REST API API Services' });
});

// Health Check Routes
app.get(['/api/v1/health', '/api/health'], async (req, res) => {
  try {
    const { sequelize } = require('./config/db');
    await sequelize.authenticate();
    res.status(200).json({
      status: 'ok',
      db: 'connected',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      db: 'disconnected',
      error: error.message,
    });
  }
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Swagger UI Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'OpenPrep AI API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  })
);

// Error Handler Middleware
app.use(errorHandler);

// Already coerced to a validated integer by config/env.js.
const PORT = env.PORT;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: getSocketCorsOrigin(),
    methods: ['GET', 'POST'],
    credentials: true,
  }, // Longer timeouts tolerate throttled timers in backgrounded/idle browser
  // tabs, so active lobby players aren't disconnected on a missed heartbeat.
  pingTimeout: 60000,
  pingInterval: 25000,
});
// Initialize socket handlers
require('./sockets/battleHandler')(io);
require('./sockets/chatHandler')(io);

// Start weekly digest background scheduler
const { startScheduler } = require('./services/weeklyDigestService');
startScheduler();

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  server.listen(PORT, () => {
    logger.info('server started', {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      logLevel: logger.getLevel(),
    });
  });
}

module.exports = app;


// Graceful Shutdown Logic
const gracefulShutdown = (signal) => {
  logger.info('graceful shutdown started', { signal });

  // Force exit timeout (10 seconds maximum connection drain)
  const forceExitTimeout = setTimeout(() => {
    logger.error('graceful shutdown timed out — forcing exit', { timeoutMs: 10000 });
    process.exit(1);
  }, 10000);

  server.close(async () => {
    logger.info('HTTP connections drained, closing resource pools');
    clearTimeout(forceExitTimeout);

    try {
      const { sequelize } = require('./config/db');
      await sequelize.close();
      logger.info('postgres connection pool closed');
    } catch (dbErr) {
      logger.error('error closing database pool', { err: dbErr });
    }

    try {
      const redisService = require('./services/redisService');
      if (redisService.client) {
        await redisService.client.quit();
        logger.info('redis connection closed');
      }
    } catch (redisErr) {
      logger.error('error closing redis connection', { err: redisErr });
    }

    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

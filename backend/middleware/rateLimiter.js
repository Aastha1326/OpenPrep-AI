const rateLimit = require('express-rate-limit');

// Skip rate limiting in test environment
const shouldSkip = () => process.env.NODE_ENV === 'test';

/**
 * AI Endpoint Rate Limiter
 * Limits AI-powered requests to prevent abuse and control Gemini API costs.
 * - 10 requests per minute per IP
 * - Provides clear error message on exhaustion
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skip: shouldSkip,
  keyGenerator: (req) => {
    return req.user && req.user.id ? String(req.user.id) : String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');
  },
  handler: (req, res, next, options) => {
    const retryInSeconds = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', retryInSeconds);
    res.status(429).json({
      success: false,
      error: 'AI rate limit exceeded',
      retryInSeconds,
      remainingQuota: 0,
    });
  },
  standardHeaders: true,
  legacyHeaders: true,
});

/**
 * Strict AI Endpoint Rate Limiter for upload+analyze endpoints
 * These endpoints do both file upload and AI analysis (more resource-intensive).
 * - 5 requests per minute per IP
 */
const strictAiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  skip: shouldSkip,
  message: {
    success: false,
    error: 'Too many AI analysis requests. Please wait a moment before uploading more files.',
  },
  standardHeaders: true,
  legacyHeaders: true,
});

/**
 * Auth Email Endpoint Rate Limiter
 * Limits sensitive email-sending endpoints to prevent spam and SMTP exhaustion.
 * - 3 requests per 15 minutes per IP
 */
const authEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  skip: shouldSkip,
  message: {
    success: false,
    error: 'Too many requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: true,
});

module.exports = { aiLimiter, strictAiLimiter, authEmailLimiter };

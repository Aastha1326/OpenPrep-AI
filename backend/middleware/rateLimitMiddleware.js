const rateLimit = require('express-rate-limit');

const shouldSkip = () => process.env.NODE_ENV === 'test';

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skip: shouldSkip,
  message: {
    success: false,
    error: 'Too many login or authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  skip: shouldSkip,
  message: {
    success: false,
    error: 'AI query limit exceeded for this hour. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  skip: shouldSkip,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authRateLimiter,
  aiRateLimiter,
  generalRateLimiter
};

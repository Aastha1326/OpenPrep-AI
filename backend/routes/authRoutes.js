const express = require('express');
const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config/constants');

const {
  register,
  login,
  getMe,
  forgotPassword,
  verifyEmail,
  resetPassword,
  refreshToken,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateRefreshToken,
} = require('../middleware/validators');

const router = express.Router();

// Skip rate limiting in test environment
const shouldSkip = () => process.env.NODE_ENV === 'test';

// Shared helper for consistent rate limit responses
const createRateLimitResponse = (errorMessage) => ({
  success: false,
  error: errorMessage,
});

// Login rate limiter: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOWS.FIFTEEN_MINUTES,
  max: RATE_LIMIT.MAX_REQUESTS.LOGIN,
  skip: shouldSkip,
  message: createRateLimitResponse(
    'Too many login attempts. Please try again after 15 minutes.'
  ),
  standardHeaders: true,
  legacyHeaders: true,
});

// Register rate limiter: 5 attempts per 15 minutes per IP
const registerLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOWS.FIFTEEN_MINUTES,
  max: RATE_LIMIT.MAX_REQUESTS.REGISTER,
  skip: shouldSkip,
  message: createRateLimitResponse(
    'Too many registration attempts. Please try again after 15 minutes.'
  ),
  standardHeaders: true,
  legacyHeaders: true,
});

// Forgot password rate limiter: 5 attempts per hour per IP
const forgotPasswordLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOWS.ONE_HOUR,
  max: RATE_LIMIT.MAX_REQUESTS.FORGOT_PASSWORD,
  skip: shouldSkip,
  message: createRateLimitResponse(
    'Too many password reset requests. Please try again after an hour.'
  ),
  standardHeaders: true,
  legacyHeaders: true,
});

// Refresh token rate limiter: 10 attempts per 15 minutes per IP
const refreshTokenLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOWS.FIFTEEN_MINUTES,
  max: RATE_LIMIT.MAX_REQUESTS.REFRESH_TOKEN,
  skip: shouldSkip,
  message: createRateLimitResponse(
    'Too many refresh requests. Please try again later.'
  ),
  standardHeaders: true,
  legacyHeaders: true,
});

// Email verification rate limiter: 5 attempts per 15 minutes per IP
const verifyEmailLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOWS.FIFTEEN_MINUTES,
  max: RATE_LIMIT.MAX_REQUESTS.VERIFY_EMAIL,
  skip: shouldSkip,
  message: createRateLimitResponse(
    'Too many email verification attempts. Please try again after 15 minutes.'
  ),
  standardHeaders: true,
  legacyHeaders: true,
});

router.post('/register', registerLimiter, validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password/:token', validateResetPassword, resetPassword);
router.post('/verify-email/:token', verifyEmailLimiter, verifyEmail);
router.post('/refresh-token', refreshTokenLimiter, validateRefreshToken, refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
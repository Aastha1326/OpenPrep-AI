const express = require('express');
const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config/constants');

const {
  register,
  login,
  googleLogin,
  googlePassportCallback,
  getMe,
  forgotPassword,
  verifyEmail,
  resetPassword,
  verifyOtp,
  resetPasswordOtp,
  refreshToken,
  logout,
  updateSettings,
  updateSM2Settings,
  resetSM2Settings,
  oauthSuccessCallback,
  registerOAuthEmail,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const passport = require('passport');

const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateRefreshToken,
  validateResendVerification,
  validateUpdateSettings,
  validateVerifyOtp,
  validateResetPasswordOtp,
} = require('../middleware/validators');
const { validateRequest, registerSchema } = require('../middleware/validate');

const router = express.Router();

// Skip rate limiting in ordinary tests, but allow dedicated rate-limit tests to explicitly enable it.
const shouldSkip = () =>
  process.env.NODE_ENV === 'test' &&
  process.env.ENABLE_RATE_LIMIT_TESTS !== 'true';

// Shared helper for consistent rate limit responses
const createRateLimitResponse = (errorMessage) => ({
  success: false,
  error: errorMessage,
});

// Login rate limiter: 5 attempts per minute per IP
const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOWS.ONE_MINUTE,
  max: RATE_LIMIT.MAX_REQUESTS.LOGIN,
  skip: shouldSkip,
  message: createRateLimitResponse(
    'Too many login attempts. Please try again after a minute.'
  ),
  standardHeaders: true,
  legacyHeaders: true,
});

// Limit registration attempts to 5 requests per minute per IP
const registerLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOWS.ONE_MINUTE,
  max: RATE_LIMIT.MAX_REQUESTS.REGISTER,
  skip: shouldSkip,
  message: createRateLimitResponse(
    'Too many registration attempts. Please try again after a minute.'
  ),
  standardHeaders: true,
  legacyHeaders: true,
});

// Limit password reset requests to 5 per hour per IP
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

const { authEmailLimiter } = require('../middleware/rateLimiter');

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

// Limit email verification attempts to 5 requests per 15 minutes per IP
const verifyEmailLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOWS.FIFTEEN_MINUTES,
  max: 5,
  skip: shouldSkip,
  message: createRateLimitResponse(
    'Too many email verification attempts. Please try again after 15 minutes.'
  ),
  standardHeaders: true,
  legacyHeaders: true,
});

// Limit reset password attempts to 5 requests per 15 minutes per IP
const resetPasswordLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOWS.FIFTEEN_MINUTES,
  max: 5,
  skip: shouldSkip,
  message: createRateLimitResponse(
    'Too many password reset attempts. Please try again after 15 minutes.'
  ),
  standardHeaders: true,
  legacyHeaders: true,
});

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

// Register a new user account
router.post('/register', registerLimiter, validateRequest(registerSchema), register);

// Authenticate a user and issue access/refresh tokens
router.post('/login', loginLimiter, validateLogin, login);

// Request a password reset email
router.post(
  '/forgot-password',
  authEmailLimiter,
  validateForgotPassword,
  forgotPassword
);

// Verify OTP reset code
router.post(
  '/verify-otp',
  resetPasswordLimiter,
  validateVerifyOtp,
  verifyOtp
);

// Reset password using OTP
router.post(
  '/reset-password',
  resetPasswordLimiter,
  validateResetPasswordOtp,
  resetPasswordOtp
);

// Resend email verification link
router.post(
  '/resend-verification',
  authEmailLimiter,
  validateResendVerification,
  resendVerification
);

// Reset password using a valid reset token
router.post('/reset-password/:token', resetPasswordLimiter, validateResetPassword, resetPassword);

// Verify a user's email address using the verification token
router.post('/verify-email/:token', verifyEmailLimiter, verifyEmail);

// Refresh an expired access token
router.post(
  '/refresh-token',
  refreshTokenLimiter,
  validateRefreshToken,
  refreshToken
);

// Log out the current user
router.post('/logout', logout);

// Retrieve the authenticated user's profile
router.get('/me', protect, getMe);

// Update authenticated user settings
router.patch('/settings', protect, validateUpdateSettings, updateSettings);

// OAuth2 Google routes
router.post('/google', googleLogin);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  oauthSuccessCallback
);

// OAuth2 GitHub routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login', session: false }),
  oauthSuccessCallback
);

// Finalize OAuth registration (e.g. if email was private/missing)
router.post('/oauth/register-email', registerOAuthEmail);

// User settings routes
router.patch('/settings', protect, updateSettings);
router.put('/sm2-settings', protect, updateSM2Settings);
router.post('/sm2-settings/reset', protect, resetSM2Settings);

module.exports = router;

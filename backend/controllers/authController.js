const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const jwt = require('jsonwebtoken');
const sendEmail = require('../services/emailService');

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

// Generate access token (15 min expiry)
const generateAccessToken = (id) => {
  return jwt.sign({ id, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

// Generate a unique token family ID for RTR
const generateTokenFamily = () => crypto.randomBytes(16).toString('hex');

// Generate refresh token (7 day expiry) — stores hashed version in DB with token family
const MAX_ACTIVE_SESSIONS = 10;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const generateRefreshToken = async (user, tokenFamily = null) => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
  const family = tokenFamily || generateTokenFamily();

  const tokens = [...(user.refreshTokens || [])];

  // Cap active sessions: keep only the most recent tokens
  if (tokens.length >= MAX_ACTIVE_SESSIONS) {
    tokens.splice(0, tokens.length - MAX_ACTIVE_SESSIONS + 1);
  }

  tokens.push({
    token: hashed,
    family,
    createdAt: new Date().toISOString(),
  });
  user.refreshTokens = tokens;
  user.refreshTokenExpire = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000); // 7 days
  await user.save();

  return { rawToken, family };
};

// ---------------------------------------------------------------------------
// Send verification email
// ---------------------------------------------------------------------------
// Send verification email
// ---------------------------------------------------------------------------
const sendVerificationEmail = async (user) => {
  const verificationToken = user.generateToken('emailVerification');
  await user.save();

  // Build frontend URL for verification link. Use FRONTEND_URL if provided,
  // otherwise default to localhost Vite dev server.
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyUrl = `${frontendBase.replace(/\/$/, '')}/verify-email/${verificationToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Email Verification — OpenPrep AI',
    text: `Please verify your email by clicking the link: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  });
};

// ---------------------------------------------------------------------------
// Send password reset email
// ---------------------------------------------------------------------------
const sendPasswordResetEmail = async (user) => {
  const resetToken = user.generateToken('resetPassword');
  await user.save();

  // Build frontend URL for password reset link. Use FRONTEND_URL if provided,
  // otherwise default to localhost Vite dev server.
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset — OpenPrep AI',
    text: `Reset your password by clicking the link: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, please ignore this email.`,
  });
};

// Helper to set refresh token as HTTP-only cookie
const setRefreshTokenCookie = (res, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

// Helper to clear refresh token cookie
const clearRefreshTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};

// ---------------------------------------------------------------------------
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// ---------------------------------------------------------------------------
exports.register = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ where: { email }, transaction: t });
    if (userExists) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    const isEmailVerified = isDevelopment;
    const user = await User.create(
      { name, email, password, role: 'student', isEmailVerified },
      { transaction: t }
    );

    if (!isEmailVerified) {
      // Send verification email (logs to console if SMTP not configured)
      await sendVerificationEmail(user, req);
    }

    // In development, issue tokens immediately so the frontend can auto-login
    let accessToken, refreshToken;
    if (isEmailVerified) {
      accessToken = generateAccessToken(user.id);
      const refreshResult = await generateRefreshToken(user);
      refreshToken = refreshResult.rawToken;
      setRefreshTokenCookie(res, refreshToken);
    }

    await t.commit();

    const response = {
      success: true,
      message: isEmailVerified
        ? 'Registration successful. Account auto-verified for development.'
        : 'Registration successful. Please verify your email to activate your account.',
      isEmailVerified,
    };

    if (isEmailVerified) {
      response.token = accessToken;
      response.refreshToken = refreshToken; // Also return in body for backward compatibility
      response.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        streak: {
          count: user.streakCount,
          lastActive: user.streakLastActive,
          freezes: user.streakFreezes || 0,
        },
        studyHours: user.studyHours,
        isEmailVerified: user.isEmailVerified,
        leaderboardVisible: user.leaderboardVisible,
      };
    }

    res.status(201).json(response);
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Verify email
// @route   POST /api/auth/verify-email/:token
// @access  Public
// ---------------------------------------------------------------------------
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpire: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpire = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ---------------------------------------------------------------------------
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error:
          'Please verify your email before logging in. Check your inbox for the verification link.',
      });
    }

    // Check if account is locked due to too many failed attempts
    if (user.lockoutUntil) {
      const lockoutTime = new Date(user.lockoutUntil);
      if (!isNaN(lockoutTime.getTime()) && lockoutTime > new Date()) {
        const remainingMinutes = Math.max(1, Math.ceil((lockoutTime - new Date()) / (1000 * 60)));
        return res.status(423).json({
          success: false,
          error: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minute${
            remainingMinutes !== 1 ? 's' : ''
          }.`,
        });
      }
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Atomically increment failed login attempts to prevent TOCTOU race condition
      await user.increment('loginAttempts', { by: 1 });
      await user.reload();

      // Lock account after 5 consecutive failures
      if (user.loginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();
      }

      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Successful login — reset lockout counters
    if (user.loginAttempts !== 0 || user.lockoutUntil !== null) {
      user.loginAttempts = 0;
      user.lockoutUntil = null;
    }

    // Update daily streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = new Date(user.streakLastActive);
    lastActive.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today - lastActive);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0 && user.streakCount === 0) {
      user.streakCount = 1;
    } else if (diffDays === 1) {
      user.streakCount += 1;
      if (user.streakCount > 0 && user.streakCount % 7 === 0) {
        user.streakFreezes = (user.streakFreezes || 0) + 1;
      }
    } else if (diffDays > 1) {
      const missedDays = diffDays - 1;
      if (user.streakFreezes && user.streakFreezes >= missedDays) {
        user.streakFreezes -= missedDays;
        user.streakCount += 1;
        if (user.streakCount > 0 && user.streakCount % 7 === 0) {
          user.streakFreezes = (user.streakFreezes || 0) + 1;
        }
      } else {
        user.streakCount = 1;
      }
    }
    user.streakLastActive = new Date();

    // Generate new token family for this login session
    const tokenFamily = generateTokenFamily();
    const accessToken = generateAccessToken(user.id);
    const refreshResult = await generateRefreshToken(user, tokenFamily);
    const refreshToken = refreshResult.rawToken;

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken, // Also return in body for backward compatibility
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        streak: {
          count: user.streakCount,
          lastActive: user.streakLastActive,
          freezes: user.streakFreezes || 0,
        },
        studyHours: user.studyHours,
        isEmailVerified: user.isEmailVerified,
        leaderboardVisible: user.leaderboardVisible,
        receiveWeeklyDigest: user.receiveWeeklyDigest,
        sm2EasyFactorModifier: user.sm2EasyFactorModifier,
        sm2IntervalModifier: user.sm2IntervalModifier,
        sm2Step1Interval: user.sm2Step1Interval,
        sm2Step2Interval: user.sm2Step2Interval,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
// ---------------------------------------------------------------------------
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Achievement, as: 'achievements' }],
    });
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        leaderboardVisible: user.leaderboardVisible,
        receiveWeeklyDigest: user.receiveWeeklyDigest,
        sm2EasyFactorModifier: user.sm2EasyFactorModifier,
        sm2IntervalModifier: user.sm2IntervalModifier,
        sm2Step1Interval: user.sm2Step1Interval,
        sm2Step2Interval: user.sm2Step2Interval,
        streak: {
          count: user.streakCount,
          lastActive: user.streakLastActive,
          freezes: user.streakFreezes || 0,
        },
        studyHours: user.studyHours,
        isEmailVerified: user.isEmailVerified,
        leaderboardVisible: user.leaderboardVisible,
        receiveWeeklyDigest: user.receiveWeeklyDigest,
        achievements: user.achievements || [],
        sm2EasyFactorModifier: user.sm2EasyFactorModifier,
        sm2IntervalModifier: user.sm2IntervalModifier,
        sm2Step1Interval: user.sm2Step1Interval,
        sm2Step2Interval: user.sm2Step2Interval,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Update current user settings (e.g. leaderboard name visibility)
// @route   PATCH /api/auth/settings
// @access  Private
// ---------------------------------------------------------------------------
exports.updateSettings = async (req, res, next) => {
  try {
    const { leaderboardVisible } = req.body;

    req.user.leaderboardVisible = leaderboardVisible;
    await req.user.save();

    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        streak: {
          count: req.user.streakCount,
          lastActive: req.user.streakLastActive,
          freezes: req.user.streakFreezes || 0,
        },
        studyHours: req.user.studyHours,
        isEmailVerified: req.user.isEmailVerified,
        leaderboardVisible: req.user.leaderboardVisible,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
// ---------------------------------------------------------------------------
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // Always return the same response to prevent email enumeration
    if (user) {
      await sendPasswordResetEmail(user, req);
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    // If email sending failed, clear the token from DB
    const user = await User.findOne({ where: { email: req.body.email } });
    if (user) {
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();
    }
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ---------------------------------------------------------------------------
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    // Invalidate all existing refresh tokens on password reset
    user.refreshTokens = [];

    // Generate new token family for fresh session after password reset
    const tokenFamily = generateTokenFamily();
    const accessToken = generateAccessToken(user.id);
    const refreshResult = await generateRefreshToken(user, tokenFamily);
    const refreshToken = refreshResult.rawToken;

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
      token: accessToken,
      refreshToken, // Also return in body for backward compatibility
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
// ---------------------------------------------------------------------------
exports.refreshToken = async (req, res, next) => {
  try {
    // Support both cookie and body for refresh token
    const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(400).json({ success: false, error: 'Refresh token is required' });
    }

    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Find user who has this hashed refresh token (supports PostgreSQL Op.contains with DB-agnostic fallback)
    let user;
    try {
      user = await User.findOne({
        where: {
          refreshTokens: {
            [Op.contains]: [{ token: hashed }],
          },
          refreshTokenExpire: { [Op.gt]: new Date() },
        },
      });
    } catch (dbErr) {
      const users = await User.findAll({
        where: {
          refreshTokenExpire: { [Op.gt]: new Date() },
        },
      });
      user = users.find(
        (u) => Array.isArray(u.refreshTokens) && u.refreshTokens.some((t) => t.token === hashed)
      );
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    // Find the specific token entry to get its family
    const tokenEntry = user.refreshTokens.find((t) => t.token === hashed);
    if (!tokenEntry) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    const tokenFamily = tokenEntry.family;

    // RTR: Check if this token family has been invalidated (reuse detection)
    const familyStillValid = user.refreshTokens.some((t) => t.family === tokenFamily);
    if (!familyStillValid) {
      // Token family was invalidated - this is a reuse attack!
      // Invalidate ALL tokens for this user as a security measure
      user.refreshTokens = [];
      await user.save();
      clearRefreshTokenCookie(res);
      return res
        .status(401)
        .json({ success: false, error: 'Token reuse detected. All sessions invalidated.' });
    }

    // Remove old token (rotation)
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== hashed);

    // Prune any tokens beyond the active session limit
    if (user.refreshTokens.length > MAX_ACTIVE_SESSIONS) {
      user.refreshTokens = user.refreshTokens.slice(-MAX_ACTIVE_SESSIONS);
    }

    // Generate new pair with same token family (rotation)
    const accessToken = generateAccessToken(user.id);
    const refreshResult = await generateRefreshToken(user, tokenFamily);
    const newRefreshToken = refreshResult.rawToken;

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken: newRefreshToken, // Also return in body for backward compatibility
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Logout user (invalidate refresh token)
// @route   POST /api/auth/logout
// @access  Public
// ---------------------------------------------------------------------------
exports.logout = async (req, res, next) => {
  try {
    // Support both cookie and body for refresh token
    const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (rawToken) {
      const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Find user who has this hashed refresh token
      const user = await User.findOne({
        where: {
          refreshTokens: {
            [Op.contains]: [{ token: hashed }],
          },
        },
      });

      if (user) {
        // Remove the token from the user's refresh tokens array
        user.refreshTokens = user.refreshTokens.filter((t) => t.token !== hashed);
        await user.save();
      }
    }

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update general user settings
// @route   PATCH /api/auth/settings
// @access  Private
exports.updateSettings = async (req, res, next) => {
  try {
    const { leaderboardVisible, receiveWeeklyDigest } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (leaderboardVisible !== undefined) {
      user.leaderboardVisible = leaderboardVisible;
    }
    if (receiveWeeklyDigest !== undefined) {
      user.receiveWeeklyDigest = receiveWeeklyDigest;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        leaderboardVisible: user.leaderboardVisible,
        receiveWeeklyDigest: user.receiveWeeklyDigest,
        sm2EasyFactorModifier: user.sm2EasyFactorModifier,
        sm2IntervalModifier: user.sm2IntervalModifier,
        sm2Step1Interval: user.sm2Step1Interval,
        sm2Step2Interval: user.sm2Step2Interval,
        streak: {
          count: user.streakCount,
          lastActive: user.streakLastActive,
        },
        studyHours: user.studyHours,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update SM-2 parameters
// @route   PUT /api/auth/sm2-settings
// @access  Private
exports.updateSM2Settings = async (req, res, next) => {
  try {
    const { sm2EasyFactorModifier, sm2IntervalModifier, sm2Step1Interval, sm2Step2Interval } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (sm2EasyFactorModifier !== undefined) {
      user.sm2EasyFactorModifier = sm2EasyFactorModifier;
    }
    if (sm2IntervalModifier !== undefined) {
      user.sm2IntervalModifier = sm2IntervalModifier;
    }
    if (sm2Step1Interval !== undefined) {
      user.sm2Step1Interval = sm2Step1Interval;
    }
    if (sm2Step2Interval !== undefined) {
      user.sm2Step2Interval = sm2Step2Interval;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        leaderboardVisible: user.leaderboardVisible,
        receiveWeeklyDigest: user.receiveWeeklyDigest,
        sm2EasyFactorModifier: user.sm2EasyFactorModifier,
        sm2IntervalModifier: user.sm2IntervalModifier,
        sm2Step1Interval: user.sm2Step1Interval,
        sm2Step2Interval: user.sm2Step2Interval,
        streak: {
          count: user.streakCount,
          lastActive: user.streakLastActive,
        },
        studyHours: user.studyHours,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset SM-2 parameters
// @route   POST /api/auth/sm2-settings/reset
// @access  Private
exports.resetSM2Settings = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.sm2EasyFactorModifier = 1.0;
    user.sm2IntervalModifier = 1.0;
    user.sm2Step1Interval = 1;
    user.sm2Step2Interval = 6;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Reset to default parameters successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        leaderboardVisible: user.leaderboardVisible,
        receiveWeeklyDigest: user.receiveWeeklyDigest,
        sm2EasyFactorModifier: user.sm2EasyFactorModifier,
        sm2IntervalModifier: user.sm2IntervalModifier,
        sm2Step1Interval: user.sm2Step1Interval,
        sm2Step2Interval: user.sm2Step2Interval,
        streak: {
          count: user.streakCount,
          lastActive: user.streakLastActive,
        },
        studyHours: user.studyHours,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};


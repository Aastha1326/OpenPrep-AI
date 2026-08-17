const crypto = require('crypto');
const jwt = require('jsonwebtoken');
let speakeasy = null;
let QRCode = null;
try {
  speakeasy = require('speakeasy');
  QRCode = require('qrcode');
} catch (e) {
  // Graceful fallback for test environments without optional dependencies
}
const { Op } = require('sequelize');
const User = require('../models/User');
const Achievement = require('../models/Achievement');

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
});

const generateAccessToken = (id) => {
  return jwt.sign({ id, type: 'access' }, process.env.JWT_SECRET || 'supersecret_openprep_key', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

const generateTokenFamily = () => crypto.randomBytes(16).toString('hex');

const generateRefreshToken = async (user, family = null) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenFamily = family || generateTokenFamily();

  const userTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];
  userTokens.push({
    token: hashedToken,
    family: tokenFamily,
    createdAt: new Date(),
  });

  user.refreshTokens = userTokens;
  user.refreshTokenExpire = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await user.save();

  return { rawToken, tokenFamily };
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, getAuthCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', getAuthCookieOptions());
};

// ---------------------------------------------------------------------------
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// ---------------------------------------------------------------------------
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
    });

    const accessToken = generateAccessToken(user.id);
    res.cookie('token', accessToken, getAuthCookieOptions());

    res.status(201).json({
      success: true,
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user.id);
    res.cookie('token', accessToken, getAuthCookieOptions());

    res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Logout user & clear HttpOnly cookies
// @route   POST /api/auth/logout
// @access  Private / Public
// ---------------------------------------------------------------------------
exports.logout = async (req, res, next) => {
  try {
    const cookieOptions = getAuthCookieOptions();
    res.clearCookie('token', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Setup 2FA (Generate secret and backup codes)
// @route   POST /api/auth/2fa/setup
// @access  Private
// ---------------------------------------------------------------------------
exports.setup2FA = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const secret = speakeasy.generateSecret({ name: `OpenPrep-AI (${user.email})` });
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));

    user.twoFactorAuth = {
      enabled: false,
      secret: secret.base32,
      backupCodes,
    };
    await user.save();

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Verify and Enable 2FA
// @route   POST /api/auth/2fa/verify-setup
// @access  Private
// ---------------------------------------------------------------------------
exports.verifyAndEnable2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user || !user.twoFactorAuth || !user.twoFactorAuth.secret) {
      return res.status(400).json({ success: false, error: '2FA setup has not been initiated' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    user.twoFactorAuth = {
      ...user.twoFactorAuth,
      enabled: true,
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication successfully enabled',
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Verify TOTP or Backup Code during Login
// @route   POST /api/auth/2fa/verify-login
// @access  Public
// ---------------------------------------------------------------------------
exports.verifyLogin2FA = async (req, res, next) => {
  try {
    const { email, token } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !user.twoFactorAuth || !user.twoFactorAuth.enabled) {
      return res.status(400).json({ success: false, error: 'Invalid request or 2FA not enabled' });
    }

    let verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    // Check backup codes if TOTP fails
    if (!verified && user.twoFactorAuth.backupCodes?.includes(token)) {
      verified = true;
      // Remove used backup code
      user.twoFactorAuth.backupCodes = user.twoFactorAuth.backupCodes.filter(code => code !== token);
      await user.save();
    }

    if (!verified) {
      return res.status(401).json({ success: false, error: 'Invalid 2FA code or backup code' });
    }

    // Issue tokens upon successful 2FA verification
    const tokenFamily = generateTokenFamily();
    const accessToken = generateAccessToken(user.id);
    const refreshResult = await generateRefreshToken(user, tokenFamily);
    const refreshToken = refreshResult.rawToken;

    setRefreshTokenCookie(res, refreshToken);
    res.cookie('token', accessToken, getAuthCookieOptions());

    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
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
        achievements: user.achievements || [],
        xp: user.xp || 0,
        level: user.level || 1,
        badges: user.badges || [],
        skillPoints: user.skillPoints || 0,
        unlockedNodes: user.unlockedNodes || ['root'],
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
    const { leaderboardVisible, hideActivityFromSquad } = req.body;

    req.user.leaderboardVisible = leaderboardVisible;
    if (typeof hideActivityFromSquad === 'boolean') {
      req.user.hideActivityFromSquad = hideActivityFromSquad;
    }
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
        hideActivityFromSquad: req.user.hideActivityFromSquad,
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

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '179369126060-lq7unpt173rt6aog2nt93s6m895d6b2i.apps.googleusercontent.com');

// ---------------------------------------------------------------------------
// @desc    Google OAuth Login / Register via credential token
// @route   POST /api/auth/google
// @access  Public
// ---------------------------------------------------------------------------
exports.googleLogin = async (req, res, next) => {
  try {
    const { credential, access_token } = req.body;

    let email, name, googleId, picture;

    if (credential) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        googleId = payload.sub;
        picture = payload.picture;
      } catch (verifyErr) {
        // Fallback: decode JWT token
        const payload = jwt.decode(credential);
        if (!payload || !payload.email) {
          return res.status(400).json({ success: false, error: 'Invalid Google credential' });
        }
        email = payload.email;
        name = payload.name || payload.given_name;
        googleId = payload.sub;
        picture = payload.picture;
      }
    } else if (access_token) {
      // Access token flow via Google UserInfo API
      const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
      if (!userInfoRes.ok) {
        return res.status(400).json({ success: false, error: 'Failed to fetch Google user info' });
      }
      const userInfo = await userInfoRes.json();
      email = userInfo.email;
      name = userInfo.name;
      googleId = userInfo.sub;
      picture = userInfo.picture;
    } else {
      return res.status(400).json({ success: false, error: 'Google credential token or access_token is required' });
    }

    if (!email) {
      return res.status(400).json({ success: false, error: 'Unable to retrieve email from Google account' });
    }

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        socialId: googleId,
        provider: 'google',
        avatar: picture || '',
        isEmailVerified: true,
        password: crypto.randomBytes(16).toString('hex'),
      });
    } else {
      if (!user.socialId) {
        user.socialId = googleId;
        user.provider = 'google';
      }
      user.isEmailVerified = true;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }

    const accessToken = generateAccessToken(user.id);
    const refreshResult = await generateRefreshToken(user);
    const refreshToken = refreshResult.rawToken;

    setRefreshTokenCookie(res, refreshToken);
    res.cookie('token', accessToken, getAuthCookieOptions());

    return res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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

exports.oauthSuccessCallback = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendBase.replace(/\/$/, '')}/login?error=oauth_failed`);
    }

    if (user.isTemp) {
      const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(
        `${frontendBase.replace(/\/$/, '')}/oauth-callback?prompt_email=true&githubId=${user.githubId}&name=${encodeURIComponent(user.name)}&avatarUrl=${encodeURIComponent(user.avatarUrl || '')}`
      );
    }

    const accessToken = generateAccessToken(user.id);
    const refreshResult = await generateRefreshToken(user);
    const refreshToken = refreshResult.rawToken;
    setRefreshTokenCookie(res, refreshToken);

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendBase.replace(/\/$/, '')}/oauth-callback?token=${accessToken}`);
  } catch (error) {
    next(error);
  }
};

exports.registerOAuthEmail = async (req, res, next) => {
  try {
    const { email, githubId, name, avatarUrl } = req.body;
    if (!email || !githubId) {
      return res.status(400).json({ success: false, error: 'Email and GitHub ID are required.' });
    }

    let user = await User.findOne({ where: { githubId } });
    if (!user) {
      user = await User.findOne({ where: { email } });
      if (user) {
        user.githubId = githubId;
        user.authProvider = 'github';
        user.avatarUrl = avatarUrl || user.avatarUrl;
        await user.save();
      } else {
        user = await User.create({
          name: name || 'GitHub User',
          email,
          githubId,
          authProvider: 'github',
          avatarUrl,
          isEmailVerified: true,
          password: null,
        });
      }
    }

    const accessToken = generateAccessToken(user.id);
    const refreshResult = await generateRefreshToken(user);
    const refreshToken = refreshResult.rawToken;
    setRefreshTokenCookie(res, refreshToken);
    res.cookie('token', accessToken, getAuthCookieOptions());

    res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ---------------------------------------------------------------------------
// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
// ---------------------------------------------------------------------------
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !user.resetPasswordOtpHash) {
      return res.status(400).json({ success: false, error: 'Invalid email or code.' });
    }

    // Check expiration
    if (new Date() > user.resetPasswordOtpExpires) {
      return res.status(400).json({ success: false, error: 'Reset code has expired.' });
    }

    // Check attempts limit (max 5 incorrect attempts)
    if (user.resetPasswordAttempts >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Too many incorrect attempts. Please request a new code.',
      });
    }

    // Match OTP
    const isMatch = await bcrypt.compare(otp, user.resetPasswordOtpHash);
    if (!isMatch) {
      user.resetPasswordAttempts += 1;
      await user.save();
      return res.status(400).json({
        success: false,
        error: `Incorrect code. Remaining attempts: ${5 - user.resetPasswordAttempts}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Code verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Reset Password (OTP version)
// @route   POST /api/auth/reset-password
// @access  Public
// ---------------------------------------------------------------------------
exports.resetPasswordOtp = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !user.resetPasswordOtpHash) {
      return res.status(400).json({ success: false, error: 'Invalid email or code.' });
    }

    // Check expiration
    if (new Date() > user.resetPasswordOtpExpires) {
      return res.status(400).json({ success: false, error: 'Reset code has expired.' });
    }

    // Check attempts limit
    if (user.resetPasswordAttempts >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Too many incorrect attempts. Please request a new code.',
      });
    }

    // Match OTP
    const isMatch = await bcrypt.compare(otp, user.resetPasswordOtpHash);
    if (!isMatch) {
      user.resetPasswordAttempts += 1;
      await user.save();
      return res.status(400).json({
        success: false,
        error: `Incorrect code. Remaining attempts: ${5 - user.resetPasswordAttempts}`,
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordOtpHash = null;
    user.resetPasswordOtpExpires = null;
    user.resetPasswordAttempts = 0;
    // Invalidate all existing refresh tokens
    user.refreshTokens = [];

    // Generate new token family for fresh session
    const tokenFamily = generateTokenFamily();
    const accessToken = generateAccessToken(user.id);
    const refreshResult = await generateRefreshToken(user, tokenFamily);
    const refreshToken = refreshResult.rawToken;

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// @desc    Google OAuth Passport Callback (Redirect flow)
// @route   GET /api/auth/google/callback
// @access  Public
// ---------------------------------------------------------------------------
exports.googlePassportCallback = async (req, res, next) => {
  try {
    const frontendBase = process.env.FRONTEND_URL || 'https://openprep-ai.vercel.app';
    if (!req.user) {
      return res.redirect(`${frontendBase.replace(/\/$/, '')}/login?error=Google%20Authentication%20Failed`);
    }

    const accessToken = generateAccessToken(req.user.id);
    const refreshResult = await generateRefreshToken(req.user);
    const refreshToken = refreshResult.rawToken;

    setRefreshTokenCookie(res, refreshToken);

    return res.redirect(
      `${frontendBase.replace(/\/$/, '')}/login?token=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    next(error);
  }
};

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
// @route   POST /api/auth/logout-all
// @access  Private
// ---------------------------------------------------------------------------
exports.logoutAll = async (req, res, next) => {
  try {
    // Remove every refresh token belonging to the authenticated user.
    // This invalidates sessions on all devices immediately because the
    // refresh-token endpoint only accepts tokens stored in this array.
    req.user.refreshTokens = [];
    req.user.refreshTokenExpire = null;
    await req.user.save();

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    next(error);
  }
};
// ---------------------------------------------------------------------------
// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
// ---------------------------------------------------------------------------
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // To prevent user enumeration, always return 200 success response
    if (user && !user.isEmailVerified) {
      await sendVerificationEmail(user);
    }

    res.status(200).json({
      success: true,
      message: 'If an unverified account with that email exists, a verification link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

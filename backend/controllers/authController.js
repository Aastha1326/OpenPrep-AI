const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

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

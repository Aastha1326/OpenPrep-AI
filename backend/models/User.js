import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

export const setup2FA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `OpenPrep-AI (${req.user.email})` });
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));

    req.user.twoFactorAuth = {
      secret: secret.base32,
      backupCodes,
      enabled: false,
    };
    await req.user.save();

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.status(200).json({ success: true, secret: secret.base32, qrCodeUrl, backupCodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

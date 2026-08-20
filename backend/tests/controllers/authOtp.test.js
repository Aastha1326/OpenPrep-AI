const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/authRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');

process.env.JWT_SECRET = 'test_jwt_secret_for_auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

/**
 * Capture the 6-digit OTP from the email body logged by emailService
 * (dev/test fallback when SMTP is not configured).
 */
const captureOtpFromEmail = (consoleSpy) => {
  const body = consoleSpy.mock.calls
    .map((call) => call.join(' '))
    .join('\n');
  const match = body.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
};

describe('Auth OTP Forgot/Reset Password - Integration Tests', () => {
  beforeEach(async () => {
    // Clear user table before each test
    await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  it('should generate OTP and trigger email, then succeed password reset with correct OTP', async () => {
    // 1. Create a user
    await User.create({
      name: 'Otp User',
      email: 'otp@example.com',
      password: 'OldPassword1!',
      isEmailVerified: true,
    });

    // 2. Request Forgot Password (capture the emailed OTP)
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'otp@example.com' });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);

    const otp = captureOtpFromEmail(consoleSpy);
    consoleSpy.mockRestore();
    expect(otp).toMatch(/^\d{6}$/);

    // 3. OTP hash + 15-minute expiry persisted in DB
    const updatedUser = await User.findOne({ where: { email: 'otp@example.com' } });
    expect(updatedUser.resetPasswordOtpHash).toBeDefined();
    expect(updatedUser.resetPasswordOtpHash).not.toBe(otp); // hashed, not raw
    expect(updatedUser.resetPasswordOtpExpires).toBeDefined();
    const ttlMs = new Date(updatedUser.resetPasswordOtpExpires).getTime() - Date.now();
    expect(ttlMs).toBeGreaterThan(14 * 60 * 1000);
    expect(ttlMs).toBeLessThanOrEqual(15 * 60 * 1000);
    expect(updatedUser.resetPasswordAttempts).toBe(0);

    // 4. Verify OTP with incorrect code
    const verifyFailRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'otp@example.com', otp: '111111' });

    expect(verifyFailRes.status).toBe(400);
    expect(verifyFailRes.body.success).toBe(false);

    // 5. Verify OTP with correct code
    const verifySuccessRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'otp@example.com', otp });

    expect(verifySuccessRes.status).toBe(200);
    expect(verifySuccessRes.body.success).toBe(true);

    // 6. Reset Password with incorrect OTP
    const resetFailRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'otp@example.com',
        otp: '111111',
        password: 'NewPassword1!',
      });
    expect(resetFailRes.status).toBe(400);

    // 7. Reset Password with invalid complexity password
    const resetComplexityFailRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'otp@example.com',
        otp,
        password: 'simple',
      });
    expect(resetComplexityFailRes.status).toBe(400);

    // 8. Reset Password with correct OTP and complex password
    const resetSuccessRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'otp@example.com',
        otp,
        password: 'NewPassword1!',
      });

    expect(resetSuccessRes.status).toBe(200);
    expect(resetSuccessRes.body.success).toBe(true);
    expect(resetSuccessRes.body.token).toBeDefined();

    // 9. OTP fields cleared after successful reset
    const afterReset = await User.findOne({ where: { email: 'otp@example.com' } });
    expect(afterReset.resetPasswordOtpHash).toBeNull();
    expect(afterReset.resetPasswordOtpExpires).toBeNull();
    expect(afterReset.resetPasswordAttempts).toBe(0);

    // 10. Verify the new password can be used to authenticate
    const loggedInUser = await User.findOne({ where: { email: 'otp@example.com' } });
    const isPasswordMatch = await loggedInUser.matchPassword('NewPassword1!');
    expect(isPasswordMatch).toBe(true);
  });

  it('should enforce a 60-second resend cooldown', async () => {
    await User.create({
      name: 'Cooldown User',
      email: 'cooldown@example.com',
      password: 'OldPassword1!',
      isEmailVerified: true,
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const firstRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'cooldown@example.com' });
    expect(firstRes.status).toBe(200);

    // Immediate second request must be rejected by the cooldown
    const secondRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'cooldown@example.com' });
    consoleSpy.mockRestore();

    expect(secondRes.status).toBe(429);
    expect(secondRes.body.success).toBe(false);
  });

  it('should lock out after 5 incorrect OTP attempts', async () => {
    await User.create({
      name: 'Lockout User',
      email: 'lockout@example.com',
      password: 'OldPassword1!',
      isEmailVerified: true,
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'lockout@example.com' });
    const otp = captureOtpFromEmail(consoleSpy);
    consoleSpy.mockRestore();
    expect(otp).toMatch(/^\d{6}$/);

    // 5 wrong attempts
    for (let i = 0; i < 5; i += 1) {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'lockout@example.com', otp: '000000' });
      expect(res.status).toBe(400);
    }

    // Even the correct OTP is now rejected
    const lockedRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'lockout@example.com', otp });
    expect(lockedRes.status).toBe(400);
    expect(lockedRes.body.error).toMatch(/Too many incorrect attempts/i);
  });

  it('should reject an expired OTP', async () => {
    await User.create({
      name: 'Expiry User',
      email: 'expiry@example.com',
      password: 'OldPassword1!',
      isEmailVerified: true,
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'expiry@example.com' });
    const otp = captureOtpFromEmail(consoleSpy);
    consoleSpy.mockRestore();
    expect(otp).toMatch(/^\d{6}$/);

    // Backdate the expiry to simulate a stale code
    const user = await User.findOne({ where: { email: 'expiry@example.com' } });
    user.resetPasswordOtpExpires = new Date(Date.now() - 1000);
    await user.save();

    const expiredRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'expiry@example.com', otp });
    expect(expiredRes.status).toBe(400);
    expect(expiredRes.body.error).toMatch(/expired/i);
  });

  it('should return a generic response for unknown emails (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/If the email exists/i);
  });
});
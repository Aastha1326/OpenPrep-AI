const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/authRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

process.env.JWT_SECRET = 'test_jwt_secret_for_auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth OTP Forgot/Reset Password - Integration Tests', () => {
  beforeEach(async () => {
    // Clear user table before each test
    await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  it('should generate OTP and trigger email, then succeed password reset with correct OTP', async () => {
    // 1. Create a user
    const user = await User.create({
      name: 'Otp User',
      email: 'otp@example.com',
      password: 'OldPassword1!',
      isEmailVerified: true,
    });

    // 2. Request Forgot Password
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'otp@example.com' });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);

    // Fetch user from DB to get OTP
    const updatedUser = await User.findOne({ where: { email: 'otp@example.com' } });
    expect(updatedUser.resetPasswordOtpHash).toBeDefined();
    expect(updatedUser.resetPasswordOtpExpires).toBeDefined();

    // Manually overwrite DB hash with a known OTP's hash for testing
    const testOtp = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(testOtp, salt);
    updatedUser.resetPasswordOtpHash = hashed;
    updatedUser.resetPasswordOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await updatedUser.save();

    // 3. Verify OTP with incorrect code
    const verifyFailRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'otp@example.com', otp: '111111' });

    expect(verifyFailRes.status).toBe(400);
    expect(verifyFailRes.body.success).toBe(false);

    // 4. Verify OTP with correct code
    const verifySuccessRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'otp@example.com', otp: '123456' });

    expect(verifySuccessRes.status).toBe(200);
    expect(verifySuccessRes.body.success).toBe(true);

    // 5. Reset Password with incorrect OTP
    const resetFailRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'otp@example.com',
        otp: '111111',
        password: 'NewPassword1!',
      });
    expect(resetFailRes.status).toBe(400);

    // 6. Reset Password with invalid complexity password
    const resetComplexityFailRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'otp@example.com',
        otp: '123456',
        password: 'simple',
      });
    expect(resetComplexityFailRes.status).toBe(400);

    // 7. Reset Password with correct OTP and complex password
    const resetSuccessRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'otp@example.com',
        otp: '123456',
        password: 'NewPassword1!',
      });

    expect(resetSuccessRes.status).toBe(200);
    expect(resetSuccessRes.body.success).toBe(true);
    expect(resetSuccessRes.body.token).toBeDefined();

    // 8. Verify the new password can be used to authenticate
    const loggedInUser = await User.findOne({ where: { email: 'otp@example.com' } });
    const isPasswordMatch = await loggedInUser.matchPassword('NewPassword1!');
    expect(isPasswordMatch).toBe(true);
  });
});

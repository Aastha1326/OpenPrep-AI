const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const authRoutes = require('../../routes/authRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');

process.env.JWT_SECRET = 'test_jwt_secret_for_auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

// Helper: create a verified user with strong password
const createVerifiedUser = async (overrides = {}) => {
  return User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'StrongPass1!',
    isEmailVerified: true,
    ...overrides,
  });
};

describe('Auth Controller - Integration Tests', () => {
  // =========================================================================
  // POST /api/auth/register
  // =========================================================================
  describe('POST /api/auth/register', () => {
    it('should register a new user and send verification email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass1!',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('verify your email');
      expect(res.body.isEmailVerified).toBe(false);
      // No token returned until email is verified
      expect(res.body.token).toBeUndefined();
    });

    it('should return 400 when email already exists', async () => {
      await createVerifiedUser({ email: 'duplicate@example.com' });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Another User',
        email: 'duplicate@example.com',
        password: 'StrongPass2!',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('User already exists');
    });

    it('should default role to student when not provided', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Student User',
        email: 'student@example.com',
        password: 'StrongPass1!',
      });

      expect(res.body.success).toBe(true);

      const user = await User.findOne({ where: { email: 'student@example.com' } });
      expect(user.role).toBe('student');
    });

    it('should ignore role field and default to student when role is sent', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Admin Wannabe',
        email: 'wannabe@example.com',
        password: 'StrongPass1!',
        role: 'admin',
      });

      expect(res.body.success).toBe(true);

      const user = await User.findOne({ where: { email: 'wannabe@example.com' } });
      expect(user.role).toBe('student');
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'missing@example.com',
        password: 'StrongPass1!',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'No Email',
        password: 'StrongPass1!',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 if name is empty', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: '', email: 'test@example.com', password: 'StrongPass1!' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'notanemail', password: 'StrongPass1!' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'Ab1!' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if password lacks uppercase', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'strongpass1!' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if password lacks special character', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'StrongPass1' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // POST /api/auth/verify-email/:token
  // =========================================================================
  describe('POST /api/auth/verify-email/:token', () => {
    it('should verify email with valid token', async () => {
      const user = await User.create({
        name: 'Verify User',
        email: 'verify@example.com',
        password: 'StrongPass1!',
        isEmailVerified: false,
      });

      // Generate a verification token directly
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
      user.emailVerificationToken = hashed;
      user.emailVerificationExpire = Date.now() + 60 * 60 * 1000;
      await user.save();

      const res = await request(app).post(`/api/auth/verify-email/${rawToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeUndefined();
      expect(res.body.refreshToken).toBeUndefined();

      // Verify user was updated
      const updated = await User.findByPk(user.id);
      expect(updated.isEmailVerified).toBe(true);
      expect(updated.emailVerificationToken).toBeNull();
    });

    it('should return 400 with invalid token', async () => {
      const res = await request(app).post('/api/auth/verify-email/invalidtoken123');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid or expired');
    });
  });

  // =========================================================================
  // POST /api/auth/login
  // =========================================================================
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a verified user with strong password
      await User.create({
        name: 'Login User',
        email: 'login@example.com',
        password: 'StrongPass1!',
        isEmailVerified: true,
      });
    });

    afterEach(async () => {
      await User.destroy({ where: { email: 'login@example.com' } });
    });

    it('should login with valid credentials and return tokens', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'StrongPass1!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.name).toBe('Login User');
      expect(res.body.user.email).toBe('login@example.com');
      expect(res.body.user.isEmailVerified).toBe(true);
    });

    it('should return 401 with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'WrongPass1!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 401 with non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'StrongPass1!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 400 when email is not provided', async () => {
      const res = await request(app).post('/api/auth/login').send({ password: 'StrongPass1!' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Please provide a valid email');
    });

    it('should return 400 when password is not provided', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Please provide a password');
    });

    it('should return 403 when email is not verified', async () => {
      // Create an unverified user
      await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'StrongPass1!',
        isEmailVerified: false,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'unverified@example.com',
        password: 'StrongPass1!',
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('verify your email');
    });

    // =========================================================================
    // Account lockout tests
    // =========================================================================

    it('should lock account after 5 failed login attempts', async () => {
      // Send 5 wrong passwords
      for (let i = 0; i < 5; i++) {
        const res = await request(app).post('/api/auth/login').send({
          email: 'login@example.com',
          password: 'WrongPass1!',
        });
        expect(res.status).toBe(401);
      }

      // Verify the user is now locked
      const user = await User.findOne({ where: { email: 'login@example.com' } });
      expect(user.loginAttempts).toBe(5);
      expect(user.lockoutUntil).toBeTruthy();
      expect(user.lockoutUntil.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return 423 when account is locked', async () => {
      // Manually lock the account
      const user = await User.findOne({ where: { email: 'login@example.com' } });
      user.loginAttempts = 5;
      user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'StrongPass1!',
      });

      expect(res.status).toBe(423);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Account locked');
      expect(res.body.error).toContain('minute');
    });

    it('should reset lockout counter on successful login', async () => {
      // Simulate 3 failed attempts first
      const userBefore = await User.findOne({ where: { email: 'login@example.com' } });
      userBefore.loginAttempts = 3;
      await userBefore.save();

      // Successful login
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'StrongPass1!',
      });
      expect(res.status).toBe(200);

      // Verify counters are reset
      const userAfter = await User.findOne({ where: { email: 'login@example.com' } });
      expect(userAfter.loginAttempts).toBe(0);
      expect(userAfter.lockoutUntil).toBeNull();
    });

    it('should allow login after lockout period expires', async () => {
      // Set lockout in the past (expired lockout)
      const user = await User.findOne({ where: { email: 'login@example.com' } });
      user.loginAttempts = 5;
      user.lockoutUntil = new Date(Date.now() - 1000); // 1 second ago
      await user.save();

      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'StrongPass1!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify counters were reset
      const userAfter = await User.findOne({ where: { email: 'login@example.com' } });
      expect(userAfter.loginAttempts).toBe(0);
      expect(userAfter.lockoutUntil).toBeNull();
    });
  });

  // =========================================================================
  // GET /api/auth/me
  // =========================================================================
  describe('GET /api/auth/me', () => {
    it('should return user profile when authenticated', async () => {
      const user = await createVerifiedUser({ email: 'profile@example.com' });

      // Login to get a token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'profile@example.com', password: 'StrongPass1!' });

      const token = loginRes.body.token;

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Test User');
      expect(res.body.user.email).toBe('profile@example.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // POST /api/auth/forgot-password
  // =========================================================================
  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email when email exists', async () => {
      await createVerifiedUser({ email: 'reset@example.com' });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('password reset link');
    });

    it('should return 200 even when email does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'ghost@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return same response for existing and non-existing emails', async () => {
      await createVerifiedUser({ email: 'exists@example.com' });

      const resExisting = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'exists@example.com' });

      const resMissing = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'missing@example.com' });

      expect(resExisting.status).toBe(resMissing.status);
      expect(resExisting.body.success).toBe(resMissing.body.success);
      expect(resExisting.body.message).toBe(resMissing.body.message);
    });
  });

  // =========================================================================
  // POST /api/auth/reset-password/:token
  // =========================================================================
  describe('POST /api/auth/reset-password/:token', () => {
    it('should reset password with valid token', async () => {
      const user = await createVerifiedUser({ email: 'resetpwd@example.com' });

      // Generate a reset token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
      user.resetPasswordToken = hashed;
      user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
      await user.save();

      const res = await request(app)
        .post(`/api/auth/reset-password/${rawToken}`)
        .send({ password: 'NewStrongPass1!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.message).toContain('Password reset successful');

      // Verify old password no longer works
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'resetpwd@example.com', password: 'StrongPass1!' });
      expect(oldLogin.status).toBe(401);

      // Verify new password works
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'resetpwd@example.com', password: 'NewStrongPass1!' });
      expect(newLogin.status).toBe(200);
    });

    it('should return 400 with invalid reset token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password/invalidtoken123')
        .send({ password: 'NewStrongPass1!' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid or expired');
    });

    it('should return 400 with weak new password', async () => {
      const user = await createVerifiedUser({ email: 'weakpwd@example.com' });
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
      user.resetPasswordToken = hashed;
      user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
      await user.save();

      const res = await request(app)
        .post(`/api/auth/reset-password/${rawToken}`)
        .send({ password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // POST /api/auth/refresh-token
  // =========================================================================
  describe('POST /api/auth/refresh-token', () => {
    it('should issue new tokens with valid refresh token', async () => {
      const user = await createVerifiedUser({ email: 'refresh@example.com' });

      // Login to get refresh token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'refresh@example.com', password: 'StrongPass1!' });

      const oldRefreshToken = loginRes.body.refreshToken;
      expect(oldRefreshToken).toBeDefined();

      // Use refresh token to get new pair
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: oldRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      // Refresh token should be different (rotation)
      expect(res.body.refreshToken).not.toBe(oldRefreshToken);
      // Access token is same user/payload — may match if issued same second
    });

    it('should return 401 with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalidtoken123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 without refresh token', async () => {
      const res = await request(app).post('/api/auth/refresh-token').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should invalidate the old refresh token after rotation (RTR)', async () => {
      // Verifies Refresh Token Rotation: the used token must be removed
      // from the DB so it cannot be replayed. This is a regression test
      // for Issue #179 — old hashed tokens were not being removed.
      const user = await createVerifiedUser({ email: 'rtrtest@example.com' });

      // Login to bootstrap the first refresh token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'rtrtest@example.com', password: 'StrongPass1!' });
      expect(loginRes.status).toBe(200);

      const firstToken = loginRes.body.refreshToken;

      // First rotation — should succeed
      const firstRotate = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: firstToken });
      expect(firstRotate.status).toBe(200);

      const secondToken = firstRotate.body.refreshToken;
      expect(secondToken).not.toBe(firstToken);

      // Try using the ORIGINAL (first) token again — must be rejected
      const replayAttempt = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: firstToken });
      expect(replayAttempt.status).toBe(401);
      expect(replayAttempt.body.success).toBe(false);
      expect(replayAttempt.body.error).toContain('Invalid or expired');

      // Second rotation with the NEW token should still work
      const secondRotate = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: secondToken });
      expect(secondRotate.status).toBe(200);
      expect(secondRotate.body.refreshToken).not.toBe(secondToken);

      // Old second token should also be invalid now
      const secondReplay = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: secondToken });
      expect(secondReplay.status).toBe(401);
    });
  });

  // =========================================================================
  // POST /api/auth/logout
  // =========================================================================
  describe('POST /api/auth/logout', () => {
    it('should clear the refreshToken httpOnly cookie on logout', async () => {
      await createVerifiedUser({ email: 'logout@example.com' });

      // Login to bootstrap a refresh token (also sets the httpOnly cookie)
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'logout@example.com', password: 'StrongPass1!' });
      expect(loginRes.status).toBe(200);

      const refreshToken = loginRes.body.refreshToken;
      expect(refreshToken).toBeDefined();

      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');

      // Response must include a Set-Cookie header that expires the cookie
      const setCookie = res.headers['set-cookie'];
      expect(Array.isArray(setCookie)).toBe(true);
      const clearCookieHeader = setCookie.find((c) => c.startsWith('refreshToken='));
      expect(clearCookieHeader).toBeDefined();
      expect(clearCookieHeader).toContain('Expires=Thu, 01 Jan 1970');
      expect(clearCookieHeader).toContain('Path=/');
      expect(clearCookieHeader).toContain('HttpOnly');
    });

    it('should invalidate the refresh token in the database after logout', async () => {
      await createVerifiedUser({ email: 'logout-invalid@example.com' });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'logout-invalid@example.com', password: 'StrongPass1!' });
      expect(loginRes.status).toBe(200);

      const refreshToken = loginRes.body.refreshToken;

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken });
      expect(logoutRes.status).toBe(200);

      // Logged-out token must no longer be accepted for rotation
      const refreshRes = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });
      expect(refreshRes.status).toBe(401);
      expect(refreshRes.body.success).toBe(false);
      expect(refreshRes.body.error).toContain('Invalid or expired');
    });

    it('should return 200 and clear the cookie even without a refresh token', async () => {
      const res = await request(app).post('/api/auth/logout').send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const setCookie = res.headers['set-cookie'];
      expect(Array.isArray(setCookie)).toBe(true);
      expect(setCookie.some((c) => c.startsWith('refreshToken='))).toBe(true);
    });
  });
});

describe('Auth Settings - Integration Tests', () => {
  let settingsUser;
  let settingsToken;

  beforeAll(async () => {
    settingsUser = await createVerifiedUser({
      email: 'settings@example.com',
      name: 'Settings User',
    });
    settingsToken = jwt.sign({ id: settingsUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  // =========================================================================
  // GET /api/auth/me — should surface leaderboardVisible
  // =========================================================================
  describe('GET /api/auth/me', () => {
    it('should include leaderboardVisible in the returned user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${settingsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('leaderboardVisible', true);
    });
  });

  // =========================================================================
  // PATCH /api/auth/settings
  // =========================================================================
  describe('PATCH /api/auth/settings', () => {
    it('should update leaderboardVisible to false (anonymous mode)', async () => {
      const res = await request(app)
        .patch('/api/auth/settings')
        .set('Authorization', `Bearer ${settingsToken}`)
        .send({ leaderboardVisible: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('leaderboardVisible', false);

      const reloaded = await User.findByPk(settingsUser.id);
      expect(reloaded.leaderboardVisible).toBe(false);
    });

    it('should update leaderboardVisible back to true', async () => {
      const res = await request(app)
        .patch('/api/auth/settings')
        .set('Authorization', `Bearer ${settingsToken}`)
        .send({ leaderboardVisible: true });

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('leaderboardVisible', true);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app)
        .patch('/api/auth/settings')
        .send({ leaderboardVisible: false });

      expect(res.status).toBe(401);
    });

    it('should return 400 when leaderboardVisible is not a boolean', async () => {
      const res = await request(app)
        .patch('/api/auth/settings')
        .set('Authorization', `Bearer ${settingsToken}`)
        .send({ leaderboardVisible: 'no' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

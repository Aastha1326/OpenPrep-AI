const request = require('supertest');
const app = require('../helpers/testApp');
const User = require('../../models/User');

describe('Auth Integration Tests', () => {
  beforeEach(async () => {
    // Clear the user table before each test to ensure isolation
    await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'StrongPass123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Registration successful/i);
    });

    it('should return 400 when registration payload fails validation', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register via the API so hooks (password hashing, email auto-verify) run correctly
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'StrongPass123!',
        });
      // Ensure the user is email-verified so login is allowed
      await User.update({ isEmailVerified: true }, { where: { email: 'jane@example.com' } });
    });

    it('should log in a verified user successfully and return 200 with token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'StrongPass123!',
        });

      if (res.status !== 200) {
        console.error('Login error body:', JSON.stringify(res.body));
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should return 401 with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      // Register a user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'StrongPass123!',
        });
      await User.update({ isEmailVerified: true }, { where: { email: 'jane@example.com' } });

      // Login to get a valid token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'StrongPass123!',
        });
      token = loginRes.body.token;
    });

    it('should return 200 and current user profile when valid token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('jane@example.com');
    });

    it('should return 401 when accessing protected route without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});


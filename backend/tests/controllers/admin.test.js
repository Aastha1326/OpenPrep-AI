const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const adminRoutes = require('../../routes/adminRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Quiz = require('../../models/Quiz');
const Flashcard = require('../../models/Flashcard');
const ActivityLog = require('../../models/ActivityLog');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

describe('Admin Dashboard API', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let regularToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_admin_tests';

    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    regularUser = await User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      role: 'student',
    });

    adminToken = jwt.sign({ id: adminUser.id, type: 'access' }, process.env.JWT_SECRET);
    regularToken = jwt.sign({ id: regularUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    delete process.env.JWT_SECRET;
  });

  describe('Authorization checks', () => {
    it('should reject non-admin users with a 403 status code', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Admin role required');
    });

    it('should allow admin users to access the statistics endpoint', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBeDefined();
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return correct analytics aggregation data shape', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          totalUsers: expect.any(Number),
          dau: expect.any(Number),
          totalQuizzes: expect.any(Number),
          totalFlashcards: expect.any(Number),
          aiRequestsToday: expect.any(Number),
        })
      );
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should allow updating user roles and write to the audit log', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'contributor' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('contributor');

      // Verify role updated in db
      const updatedUser = await User.findByPk(regularUser.id);
      expect(updatedUser.role).toBe('contributor');

      // Verify audit log entry exists
      const auditLog = await ActivityLog.findOne({
        where: {
          user: adminUser.id,
          activityType: 'admin_audit',
        },
      });
      expect(auditLog).toBeDefined();
      expect(auditLog.description).toContain('contributor');
    });

    it('should reject invalid role options', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superhero' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should reject self deletion request', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('delete/ban yourself');
    });

    it('should successfully delete a user and write to the audit log', async () => {
      const userToDelete = await User.create({
        name: 'Spammer User',
        email: 'spam@example.com',
        password: 'password123',
      });

      const res = await request(app)
        .delete(`/api/admin/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const checkUser = await User.findByPk(userToDelete.id);
      expect(checkUser).toBeNull();

      // Verify audit log entry
      const deleteAudit = await ActivityLog.findOne({
        where: {
          user: adminUser.id,
          activityType: 'admin_audit',
          description: {
            [Op.like]: '%Deleted user account%',
          },
        },
      });
      expect(deleteAudit).toBeDefined();
    });
  });
});

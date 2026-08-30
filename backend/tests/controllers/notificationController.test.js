/**
 * Integration tests for Notifications API endpoints
 */
const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const notificationRoutes = require('../../routes/notificationRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const PushSubscription = require('../../models/PushSubscription');

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);
app.use(errorHandler);

describe('Notification Controller - Integration Tests', () => {
  let testUser;
  let otherUser;
  let authToken;
  let otherToken;
  let existingNotification;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_notifications';

    testUser = await User.create({
      name: 'Notifications User',
      email: `notifuser_${uuidv4().slice(0, 8)}@example.com`,
      password: 'password123',
    });

    otherUser = await User.create({
      name: 'Other Notif User',
      email: `othernotif_${uuidv4().slice(0, 8)}@example.com`,
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);
    otherToken = jwt.sign({ id: otherUser.id }, process.env.JWT_SECRET);

    existingNotification = await Notification.create({
      user: testUser.id,
      title: 'Math Study Session',
      message: 'Your mathematics session starts in 15 minutes.',
      type: 'task_due',
      isRead: false,
    });
  });

  afterAll(async () => {
    delete process.env.JWT_SECRET;
  });

  describe('GET /api/notifications', () => {
    it('should return recent user notifications and unreadCount', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data[0].id).toBe(existingNotification.id);
    });

    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark an owned notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${existingNotification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);

      const updated = await Notification.findByPk(existingNotification.id);
      expect(updated.isRead).toBe(true);
    });

    it('should return 404 when marking a non-existent notification', async () => {
      const fakeId = uuidv4();
      const res = await request(app)
        .patch(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 when marking another user\'s notification', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${existingNotification.id}/read`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('should mark all unread user notifications as read', async () => {
      await Notification.create({
        user: testUser.id,
        title: 'New Deck Shared',
        message: 'A new organic chemistry deck was uploaded to community.',
        type: 'general',
        isRead: false,
      });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBe(0);

      const unreadCount = await Notification.count({
        where: { user: testUser.id, isRead: false },
      });
      expect(unreadCount).toBe(0);
    });
  });

  describe('POST /api/notifications/subscribe-push', () => {
    it('should register a valid push subscription successfully', async () => {
      const payload = {
        endpoint: 'https://updates.push.com/mock-endpoint-1234',
        keys: {
          p256dh: 'mock_p256dh_key_values_here',
          auth: 'mock_auth_key_values_here',
        },
      };

      const res = await request(app)
        .post('/api/notifications/subscribe-push')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('registered successfully');
      expect(res.body.data.endpoint).toBe(payload.endpoint);

      const stored = await PushSubscription.findOne({ where: { user: testUser.id } });
      expect(stored).toBeDefined();
      expect(stored.endpoint).toBe(payload.endpoint);
    });

    it('should return 400 if keys are missing from registration payload', async () => {
      const payload = {
        endpoint: 'https://updates.push.com/mock-endpoint-1234',
      };

      const res = await request(app)
        .post('/api/notifications/subscribe-push')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);

      expect(res.status).toBe(400);
    });
  });
});

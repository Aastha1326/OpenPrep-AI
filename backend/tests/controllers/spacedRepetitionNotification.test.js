const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const webpush = require('web-push');
const notificationRoutes = require('../../routes/notificationRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Flashcard = require('../../models/Flashcard');
const { initNotificationCron } = require('../../services/notificationService');

// Mock web-push
vi.mock('web-push', () => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn().mockResolvedValue({}),
}));

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);
app.use(errorHandler);

describe('Automated Spaced Repetition Notification Reminders', () => {
  let testUser;
  let authToken;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_push';
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
    await Flashcard.destroy({ where: {} });
    vi.clearAllMocks();

    testUser = await User.create({
      name: 'Push Student',
      email: 'pushstudent@example.com',
      password: 'password123',
      dailyReminderTime: '09:00',
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  it('should allow user to subscribe with push subscription', async () => {
    const dummySubscription = {
      endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/gAAAAAB...',
      keys: {
        auth: 'authKey123',
        p256dh: 'p256dhKey123',
      },
    };

    const res = await request(app)
      .post('/api/notifications/subscribe')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ subscription: dummySubscription });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findByPk(testUser.id);
    expect(updatedUser.pushSubscription).toBeDefined();
    expect(updatedUser.pushSubscription.endpoint).toBe(dummySubscription.endpoint);
  });

  it('should allow user to unsubscribe from push notifications', async () => {
    // 1. Pre-subscribe
    const user = await User.findByPk(testUser.id);
    user.pushSubscription = { endpoint: 'https://test-endpoint.com' };
    await user.save();

    // 2. Perform unsubscribe
    const res = await request(app)
      .post('/api/notifications/unsubscribe')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findByPk(testUser.id);
    expect(updatedUser.pushSubscription).toBeNull();
  });

  it('should allow user to update reminder time preferences', async () => {
    const res = await request(app)
      .put('/api/notifications/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ dailyReminderTime: '18:30' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dailyReminderTime).toBe('18:30');

    const updatedUser = await User.findByPk(testUser.id);
    expect(updatedUser.dailyReminderTime).toBe('18:30');
  });

  it('should reject invalid daily reminder time formats', async () => {
    const res = await request(app)
      .put('/api/notifications/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ dailyReminderTime: '25:00' }); // Invalid hour

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid time format');
  });
});

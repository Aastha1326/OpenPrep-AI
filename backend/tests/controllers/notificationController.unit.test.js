const notificationController = require('../../controllers/notificationController');
const Notification = require('../../models/Notification');
const PushSubscription = require('../../models/PushSubscription');

describe('Notification Controller - Unit Tests', () => {
  const fakeUser = { id: '11111111-1111-1111-1111-111111111111' };

  describe('getUserNotifications', () => {
    it('should return recent notifications and unread count for user', async () => {
      const mockList = [
        { id: 'n1', title: 'Task Reminder', isRead: false },
        { id: 'n2', title: 'Weakness Alert', isRead: true },
      ];

      vi.spyOn(Notification, 'findAll').mockResolvedValue(mockList);
      vi.spyOn(Notification, 'count').mockResolvedValue(1);

      const req = { user: fakeUser };
      let statusCode = null;
      let responseData = null;

      const res = {
        status(c) {
          statusCode = c;
          return this;
        },
        json(d) {
          responseData = d;
          return this;
        },
      };

      await notificationController.getUserNotifications(req, res, (err) => {
        if (err) throw err;
      });

      expect(statusCode).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.unreadCount).toBe(1);
      expect(responseData.count).toBe(2);

      Notification.findAll.mockRestore();
      Notification.count.mockRestore();
    });
  });

  describe('markNotificationRead', () => {
    it('should mark single notification as read and return updated unread count', async () => {
      const mockNotif = {
        id: 'n1',
        user: fakeUser.id,
        isRead: false,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Notification, 'findOne').mockResolvedValue(mockNotif);
      vi.spyOn(Notification, 'count').mockResolvedValue(0);

      const req = { user: fakeUser, params: { id: 'n1' } };
      let statusCode = null;
      let responseData = null;

      const res = {
        status(c) {
          statusCode = c;
          return this;
        },
        json(d) {
          responseData = d;
          return this;
        },
      };

      await notificationController.markNotificationRead(req, res, (err) => {
        if (err) throw err;
      });

      expect(statusCode).toBe(200);
      expect(mockNotif.isRead).toBe(true);
      expect(responseData.unreadCount).toBe(0);

      Notification.findOne.mockRestore();
      Notification.count.mockRestore();
    });
  });

  describe('markAllNotificationsRead', () => {
    it('should update all unread notifications to read', async () => {
      vi.spyOn(Notification, 'update').mockResolvedValue([2]);

      const req = { user: fakeUser };
      let statusCode = null;
      let responseData = null;

      const res = {
        status(c) {
          statusCode = c;
          return this;
        },
        json(d) {
          responseData = d;
          return this;
        },
      };

      await notificationController.markAllNotificationsRead(req, res, (err) => {
        if (err) throw err;
      });

      expect(statusCode).toBe(200);
      expect(responseData.unreadCount).toBe(0);

      Notification.update.mockRestore();
    });
  });

  describe('subscribePushNotifications', () => {
    it('should save VAPID push subscription keys', async () => {
      const mockSub = {
        id: 'p1',
        user: fakeUser.id,
        endpoint: 'https://push.example.com/sub-123',
        keys: { p256dh: 'mockKey', auth: 'mockAuth' },
      };

      vi.spyOn(PushSubscription, 'findOne').mockResolvedValue(null);
      vi.spyOn(PushSubscription, 'create').mockResolvedValue(mockSub);

      const req = {
        user: fakeUser,
        body: {
          endpoint: 'https://push.example.com/sub-123',
          keys: { p256dh: 'mockKey', auth: 'mockAuth' },
        },
      };

      let statusCode = null;
      let responseData = null;

      const res = {
        status(c) {
          statusCode = c;
          return this;
        },
        json(d) {
          responseData = d;
          return this;
        },
      };

      await notificationController.subscribePushNotifications(req, res, (err) => {
        if (err) throw err;
      });

      expect(statusCode).toBe(201);
      expect(responseData.success).toBe(true);

      PushSubscription.findOne.mockRestore();
      PushSubscription.create.mockRestore();
    });
  });
});

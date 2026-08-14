const notificationService = require('../../services/notificationService');
const Notification = require('../../models/Notification');
const PushSubscription = require('../../models/PushSubscription');

describe('Notification Service - Unit Tests', () => {
  it('should create notification in database and trigger socket room emission', async () => {
    const fakeUserId = '11111111-1111-1111-1111-111111111111';
    const fakeNotification = {
      id: '22222222-2222-2222-2222-222222222222',
      user: fakeUserId,
      title: 'Daily Streak Milestone!',
      message: 'You completed 5 days in a row.',
      type: 'streak',
      isRead: false,
      createdAt: new Date(),
    };

    vi.spyOn(Notification, 'create').mockResolvedValue(fakeNotification);
    vi.spyOn(PushSubscription, 'findAll').mockResolvedValue([]);

    let emittedRoom = null;
    let emittedEvent = null;
    let emittedPayload = null;

    const mockIo = {
      to(room) {
        emittedRoom = room;
        return {
          emit(event, payload) {
            emittedEvent = event;
            emittedPayload = payload;
          },
        };
      },
    };

    const notif = await notificationService.createNotification(
      fakeUserId,
      'Daily Streak Milestone!',
      'You completed 5 days in a row.',
      'streak',
      '/achievements',
      mockIo
    );

    expect(notif).toBeDefined();
    expect(notif.title).toBe('Daily Streak Milestone!');
    expect(emittedRoom).toBe(`user:${fakeUserId}`);
    expect(emittedEvent).toBe('notification:new');
    expect(emittedPayload.title).toBe('Daily Streak Milestone!');

    Notification.create.mockRestore();
    PushSubscription.findAll.mockRestore();
  });
});

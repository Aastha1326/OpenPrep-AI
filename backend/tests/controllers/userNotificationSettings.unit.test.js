const { getNotificationSettings, updateNotificationSettings } = require('../../controllers/userController');
const { NotificationSettings } = require('../../models');

describe('User Notification Settings API Controller', () => {
  let req, res, next;

  beforeEach(() => {
    vi.restoreAllMocks();

    req = {
      user: { id: 'user-777' },
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn();
  });

  it('should find or create notification settings and return them', async () => {
    const mockSettings = {
      userId: 'user-777',
      dailyDigestEnabled: true,
    };

    vi.spyOn(NotificationSettings, 'findOrCreate').mockResolvedValue([mockSettings, true]);

    await getNotificationSettings(req, res, next);

    expect(NotificationSettings.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-777' } })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: mockSettings
      })
    );
  });

  it('should update and save settings in the database', async () => {
    req.body = {
      dailyDigestEnabled: false,
      channelTelegramEnabled: true,
      telegramChatId: 'tg-888',
    };

    const mockSettings = {
      userId: 'user-777',
      dailyDigestEnabled: true,
      channelTelegramEnabled: false,
      telegramChatId: null,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(NotificationSettings, 'findOne').mockResolvedValue(mockSettings);

    await updateNotificationSettings(req, res, next);

    expect(NotificationSettings.findOne).toHaveBeenCalledWith({
      where: { userId: 'user-777' }
    });
    expect(mockSettings.dailyDigestEnabled).toBe(false);
    expect(mockSettings.channelTelegramEnabled).toBe(true);
    expect(mockSettings.telegramChatId).toBe('tg-888');
    expect(mockSettings.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

const { dispatchDailyDigestForUser, runAllDailyDigests } = require('../../services/notificationSchedulerService');
const { User, Flashcard, StudyPlan, NotificationSettings } = require('../../models');
const emailDigestService = require('../../services/emailDigestService');
const telegramBotService = require('../../services/telegramBotService');
const webhookDispatcherService = require('../../services/webhookDispatcherService');

describe('Notification Scheduler Service & Digest Engines', () => {
  let mockUser, mockSettings;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockUser = {
      id: 'user-111',
      name: 'Test Student',
      email: 'test@openprep.ai',
      streakCount: 5,
    };

    mockSettings = {
      dailyDigestEnabled: true,
      dailyDigestTime: '07:00:00',
      channelEmailEnabled: true,
      channelTelegramEnabled: true,
      telegramChatId: 'tg-999',
    };

    vi.spyOn(NotificationSettings, 'findOrCreate').mockResolvedValue([mockSettings, true]);
    vi.spyOn(Flashcard, 'count').mockResolvedValue(12);
    vi.spyOn(StudyPlan, 'findAll').mockResolvedValue([
      {
        dailyGoals: [
          { date: new Date().toISOString().split('T')[0], topic: 'Calculus Limit Theorems' }
        ]
      }
    ]);

    vi.spyOn(emailDigestService, 'sendDailyDigestEmail').mockResolvedValue(true);
    vi.spyOn(telegramBotService, 'sendTelegramDigest').mockResolvedValue({ success: true });
    vi.spyOn(webhookDispatcherService, 'dispatchWebhookNotification').mockResolvedValue({ success: true });
  });

  it('should compile briefing and dispatch through enabled channels', async () => {
    process.env.OUTGOING_WEBHOOK_URL = 'http://mock-webhook.com';

    await dispatchDailyDigestForUser(mockUser);

    expect(NotificationSettings.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-111' } })
    );
    expect(Flashcard.count).toHaveBeenCalled();
    expect(StudyPlan.findAll).toHaveBeenCalled();
    
    expect(emailDigestService.sendDailyDigestEmail).toHaveBeenCalledWith(
      'test@openprep.ai',
      expect.objectContaining({
        userName: 'Test Student',
        overdueFlashcardsCount: 12,
        streakCount: 5,
        scheduledTopics: ['Calculus Limit Theorems']
      })
    );
    expect(telegramBotService.sendTelegramDigest).toHaveBeenCalledWith(
      'tg-999',
      expect.objectContaining({ userName: 'Test Student' })
    );
    expect(webhookDispatcherService.dispatchWebhookNotification).toHaveBeenCalledWith(
      'http://mock-webhook.com',
      expect.objectContaining({ userName: 'Test Student' })
    );
  });

  it('should skip dispatches if dailyDigestEnabled is set to false', async () => {
    mockSettings.dailyDigestEnabled = false;

    await dispatchDailyDigestForUser(mockUser);

    expect(Flashcard.count).not.toHaveBeenCalled();
    expect(emailDigestService.sendDailyDigestEmail).not.toHaveBeenCalled();
  });

  it('should run digests loop for all users', async () => {
    vi.spyOn(User, 'findAll').mockResolvedValue([mockUser]);
    vi.spyOn(NotificationSettings, 'findOrCreate').mockResolvedValue([mockSettings, true]);

    await runAllDailyDigests();

    expect(User.findAll).toHaveBeenCalled();
    expect(Flashcard.count).toHaveBeenCalled();
  });
});

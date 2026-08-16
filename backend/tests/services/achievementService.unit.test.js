const { checkAndAwardBadges } = require('../../../backend/services/achievementService');
const { Achievement, Notification } = require('../../../backend/models');
const { BADGES } = require('../../../backend/config/badges');

vi.mock('../../../backend/models', () => ({
  Achievement: {
    findAll: vi.fn(),
    create: vi.fn(),
  },
  Notification: {
    create: vi.fn(),
  }
}));

describe('achievementService', () => {
  let userId;

  beforeEach(() => {
    userId = 'test-user-id';
    vi.clearAllMocks();
  });

  test('should not award badges if event is invalid', async () => {
    const result = await checkAndAwardBadges(userId, { type: null });
    expect(result).toEqual([]);
  });

  test('should award WEEK_WARRIOR for 7-day streak', async () => {
    Achievement.findAll.mockResolvedValue([]);
    Achievement.create.mockResolvedValue({ toJSON: () => ({ userId, badgeId: BADGES.WEEK_WARRIOR.id }) });
    
    const event = { type: 'STREAK_UPDATED', payload: { streakDays: 7 } };
    const result = await checkAndAwardBadges(userId, event);

    expect(Achievement.findAll).toHaveBeenCalledWith({
      where: { userId, badgeId: [BADGES.WEEK_WARRIOR.id] }
    });
    expect(Achievement.create).toHaveBeenCalledWith({ userId, badgeId: BADGES.WEEK_WARRIOR.id });
    expect(Notification.create).toHaveBeenCalled();
    expect(result.length).toBe(1);
    expect(result[0].badge.id).toBe(BADGES.WEEK_WARRIOR.id);
  });

  test('should not duplicate WEEK_WARRIOR if already awarded', async () => {
    Achievement.findAll.mockResolvedValue([{ badgeId: BADGES.WEEK_WARRIOR.id }]);
    
    const event = { type: 'STREAK_UPDATED', payload: { streakDays: 8 } };
    const result = await checkAndAwardBadges(userId, event);

    expect(Achievement.create).not.toHaveBeenCalled();
    expect(result.length).toBe(0);
  });

  test('should award QUIZ_MASTER for 100% score', async () => {
    Achievement.findAll.mockResolvedValue([]);
    Achievement.create.mockResolvedValue({ toJSON: () => ({ userId, badgeId: BADGES.QUIZ_MASTER.id }) });
    
    const event = { type: 'QUIZ_SUBMIT', payload: { score: 100, consecutiveHighScores: 1 } };
    const result = await checkAndAwardBadges(userId, event);

    expect(Achievement.create).toHaveBeenCalledWith({ userId, badgeId: BADGES.QUIZ_MASTER.id });
    expect(result[0].badge.id).toBe(BADGES.QUIZ_MASTER.id);
  });

  test('should award SHARPSHOOTER for 3 consecutive >85% scores', async () => {
    Achievement.findAll.mockResolvedValue([]);
    Achievement.create.mockResolvedValue({ toJSON: () => ({ userId, badgeId: BADGES.SHARPSHOOTER.id }) });
    
    const event = { type: 'QUIZ_SUBMIT', payload: { score: 90, consecutiveHighScores: 3 } };
    const result = await checkAndAwardBadges(userId, event);

    expect(Achievement.create).toHaveBeenCalledWith({ userId, badgeId: BADGES.SHARPSHOOTER.id });
    expect(result[0].badge.id).toBe(BADGES.SHARPSHOOTER.id);
  });

  test('should award EARLY_BIRD for study before 7 AM', async () => {
    Achievement.findAll.mockResolvedValue([]);
    Achievement.create.mockResolvedValue({ toJSON: () => ({ userId, badgeId: BADGES.EARLY_BIRD.id }) });
    
    const earlyMorning = new Date();
    earlyMorning.setHours(6, 30, 0, 0);

    const event = { type: 'STUDY_SESSION_LOGGED', payload: { startTime: earlyMorning } };
    const result = await checkAndAwardBadges(userId, event);

    expect(Achievement.create).toHaveBeenCalledWith({ userId, badgeId: BADGES.EARLY_BIRD.id });
    expect(result[0].badge.id).toBe(BADGES.EARLY_BIRD.id);
  });

  test('should NOT award EARLY_BIRD for study after 7 AM', async () => {
    const lateMorning = new Date();
    lateMorning.setHours(8, 0, 0, 0);

    const event = { type: 'STUDY_SESSION_LOGGED', payload: { startTime: lateMorning } };
    const result = await checkAndAwardBadges(userId, event);

    expect(Achievement.findAll).not.toHaveBeenCalled();
    expect(result.length).toBe(0);
  });
});

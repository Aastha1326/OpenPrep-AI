const { awardXP } = require('../../services/gamificationService');
const models = require('../../models');
const cacheService = require('../../services/cacheService');
const xpRateLimiter = require('../../services/xpRateLimiter');

describe('Squad Gamification Unit Tests', () => {
  let userSpy, squadMemberSpy, squadChallengeSpy, squadContribSpy, squadAchievementSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    
    userSpy = vi.spyOn(models.User, 'findByPk').mockResolvedValue(null);
    vi.spyOn(models.UserBadge, 'findOne').mockResolvedValue(null);
    vi.spyOn(models.UserBadge, 'create').mockResolvedValue({});
    vi.spyOn(models.QuizAttempt, 'count').mockResolvedValue(0);
    
    squadMemberSpy = vi.spyOn(models.SquadMember, 'findAll').mockResolvedValue([]);
    squadChallengeSpy = vi.spyOn(models.SquadChallenge, 'findAll').mockResolvedValue([]);
    squadContribSpy = vi.spyOn(models.SquadChallengeContribution, 'findOrCreate').mockResolvedValue([{}, false]);
    squadAchievementSpy = vi.spyOn(models.SquadAchievement, 'findOrCreate').mockResolvedValue([{}, false]);
    
    vi.spyOn(cacheService, 'get').mockResolvedValue(null);
    vi.spyOn(cacheService, 'set').mockResolvedValue(true);
  });

  it('should aggregate XP to active squad challenges', async () => {
    const mockUser = {
      id: 'user-123',
      xp: 100,
      level: 1,
      save: vi.fn(),
    };
    userSpy.mockResolvedValue(mockUser);

    squadMemberSpy.mockResolvedValue([{ squadId: 'squad-1' }]);
    
    const mockChallenge = {
      id: 'challenge-1',
      squadId: 'squad-1',
      currentXp: 0,
      targetXp: 1000,
      status: 'active',
      save: vi.fn()
    };
    squadChallengeSpy.mockResolvedValue([mockChallenge]);

    const mockContribution = {
      contributedXp: 0,
      save: vi.fn()
    };
    squadContribSpy.mockResolvedValue([mockContribution, true]);

    await awardXP('user-123', 50, 'quiz_complete');

    expect(mockChallenge.currentXp).toBe(50);
    expect(mockChallenge.save).toHaveBeenCalled();
    
    expect(mockContribution.contributedXp).toBe(50);
    expect(mockContribution.save).toHaveBeenCalled();
  });

  it('should complete challenge and award achievement if target reached', async () => {
    const mockUser = {
      id: 'user-123',
      xp: 100,
      level: 1,
      save: vi.fn(),
    };
    userSpy.mockResolvedValue(mockUser);

    squadMemberSpy.mockResolvedValue([{ squadId: 'squad-1' }]);
    
    const mockChallenge = {
      id: 'challenge-1',
      squadId: 'squad-1',
      currentXp: 950,
      targetXp: 1000,
      status: 'active',
      save: vi.fn()
    };
    squadChallengeSpy.mockResolvedValue([mockChallenge]);

    const mockContribution = {
      contributedXp: 100,
      save: vi.fn()
    };
    squadContribSpy.mockResolvedValue([mockContribution, false]);

    await awardXP('user-123', 100, 'quiz_complete');

    expect(mockChallenge.currentXp).toBe(1000);
    expect(mockChallenge.status).toBe('completed');
    expect(mockChallenge.save).toHaveBeenCalled();
    
    expect(squadAchievementSpy).toHaveBeenCalledWith({
      where: { squadId: 'squad-1', badgeCode: 'challenge_completed' },
      defaults: { unlockedAt: expect.any(Date) }
    });
  });

  it('should not award XP if hourly limit reached (duplicate activity exploit)', async () => {
    // Hourly allowance already spent — the limiter grants nothing, so no XP
    // reaches the squad challenges.
    vi.spyOn(xpRateLimiter, 'consume').mockResolvedValue({
      granted: 0,
      usage: xpRateLimiter.HOURLY_XP_CAP,
      remaining: 0,
      capped: true,
      degraded: false,
    });

    const mockUser = {
      id: 'user-123',
      xp: 100,
      level: 1,
      save: vi.fn(),
    };
    userSpy.mockResolvedValue(mockUser);

    const result = await awardXP('user-123', 50, 'quiz_complete');
    
    expect(result.message).toBe('Hourly XP limit reached');
    expect(squadMemberSpy).not.toHaveBeenCalled();
  });
});

const { createSquad, generateInviteCode, joinSquad, leaveSquad } = require('../../services/squadService');
const { StudySquad, SquadMember } = require('../../models');

vi.mock('../../models', () => ({
  StudySquad: {
    findOne: vi.fn(),
    create: vi.fn(),
    findByPk: vi.fn()
  },
  SquadMember: {
    findOne: vi.fn(),
    create: vi.fn(),
    findAll: vi.fn(),
    destroy: vi.fn()
  },
  User: {}
}));

describe('Squad Service', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInviteCode', () => {
    it('should generate a 6 character code', () => {
      const code = generateInviteCode();
      expect(code.length).toBe(6);
      expect(typeof code).toBe('string');
    });
  });

  describe('createSquad', () => {
    it('should create a squad and add admin member', async () => {
      StudySquad.findOne.mockResolvedValue(null);
      StudySquad.create.mockResolvedValue({ id: 'squad-1', name: 'Test Squad' });
      SquadMember.create.mockResolvedValue({ id: 'member-1' });

      const squad = await createSquad('user-1', 'Test Squad');

      expect(squad.name).toBe('Test Squad');
      expect(StudySquad.create).toHaveBeenCalled();
      expect(SquadMember.create).toHaveBeenCalledWith(expect.objectContaining({
        squadId: 'squad-1',
        userId: 'user-1',
        role: 'admin'
      }));
    });
  });

  describe('joinSquad', () => {
    it('should allow joining with valid invite code', async () => {
      StudySquad.findOne.mockResolvedValue({ id: 'squad-1' });
      SquadMember.findOne.mockResolvedValue(null);
      SquadMember.create.mockResolvedValue({ id: 'member-2' });

      const squad = await joinSquad('user-2', 'ABCDEF');
      
      expect(squad.id).toBe('squad-1');
      expect(SquadMember.create).toHaveBeenCalledWith(expect.objectContaining({
        squadId: 'squad-1',
        userId: 'user-2',
        role: 'member'
      }));
    });

    it('should reject invalid invite code', async () => {
      StudySquad.findOne.mockResolvedValue(null);
      await expect(joinSquad('user-2', 'INVALID')).rejects.toThrow('Invalid invite code');
    });

    it('should reject duplicate membership', async () => {
      StudySquad.findOne.mockResolvedValue({ id: 'squad-1' });
      SquadMember.findOne.mockResolvedValue({ id: 'member-1' });

      await expect(joinSquad('user-1', 'ABCDEF')).rejects.toThrow('User is already a member of this squad');
    });
  });

  describe('leaveSquad', () => {
    it('should destroy membership', async () => {
      const mockDestroy = vi.fn();
      SquadMember.findOne.mockResolvedValue({ destroy: mockDestroy, squadId: 'squad-1', userId: 'user-2' });
      StudySquad.findByPk.mockResolvedValue({ adminUserId: 'user-1' }); // Not admin

      await leaveSquad('user-2', 'squad-1');
      expect(mockDestroy).toHaveBeenCalled();
    });
  });
});

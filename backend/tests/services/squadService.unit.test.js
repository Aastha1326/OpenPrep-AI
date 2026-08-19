const { createSquad, generateInviteCode, joinSquad, leaveSquad } = require('../../services/squadService');
const models = require('../../models');

describe('Squad Service', () => {
  let squadFindSpy, squadCreateSpy, squadPkSpy;
  let memberFindSpy, memberCreateSpy, memberAllSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    squadFindSpy = vi.spyOn(models.StudySquad, 'findOne').mockResolvedValue(null);
    squadCreateSpy = vi.spyOn(models.StudySquad, 'create').mockResolvedValue({});
    squadPkSpy = vi.spyOn(models.StudySquad, 'findByPk').mockResolvedValue(null);
    
    memberFindSpy = vi.spyOn(models.SquadMember, 'findOne').mockResolvedValue(null);
    memberCreateSpy = vi.spyOn(models.SquadMember, 'create').mockResolvedValue({});
    memberAllSpy = vi.spyOn(models.SquadMember, 'findAll').mockResolvedValue([]);
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
      squadFindSpy.mockResolvedValue(null);
      squadCreateSpy.mockResolvedValue({ id: 'squad-1', name: 'Test Squad' });
      memberCreateSpy.mockResolvedValue({ id: 'member-1' });

      const squad = await createSquad('user-1', 'Test Squad');

      expect(squad.name).toBe('Test Squad');
      expect(squadCreateSpy).toHaveBeenCalled();
      expect(memberCreateSpy).toHaveBeenCalledWith(expect.objectContaining({
        squadId: 'squad-1',
        userId: 'user-1',
        role: 'admin'
      }));
    });
  });

  describe('joinSquad', () => {
    it('should allow joining with valid invite code', async () => {
      squadFindSpy.mockResolvedValue({ id: 'squad-1' });
      memberFindSpy.mockResolvedValue(null);
      memberCreateSpy.mockResolvedValue({ id: 'member-2' });

      const squad = await joinSquad('user-2', 'ABCDEF');
      
      expect(squad.id).toBe('squad-1');
      expect(memberCreateSpy).toHaveBeenCalledWith(expect.objectContaining({
        squadId: 'squad-1',
        userId: 'user-2',
        role: 'member'
      }));
    });

    it('should reject invalid invite code', async () => {
      squadFindSpy.mockResolvedValue(null);
      await expect(joinSquad('user-2', 'INVALID')).rejects.toThrow('Invalid invite code');
    });

    it('should reject duplicate membership', async () => {
      squadFindSpy.mockResolvedValue({ id: 'squad-1' });
      memberFindSpy.mockResolvedValue({ id: 'member-1' });

      await expect(joinSquad('user-1', 'ABCDEF')).rejects.toThrow('User is already a member of this squad');
    });
  });

  describe('leaveSquad', () => {
    it('should destroy membership', async () => {
      const mockDestroy = vi.fn();
      memberFindSpy.mockResolvedValue({ destroy: mockDestroy, squadId: 'squad-1', userId: 'user-2' });
      squadPkSpy.mockResolvedValue({ adminUserId: 'user-1' }); // Not admin

      await leaveSquad('user-2', 'squad-1');
      expect(mockDestroy).toHaveBeenCalled();
    });
  });
});

const squadController = require('../../controllers/squadController');
const squadService = require('../../services/squadService');
const models = require('../../models');

describe('Squad Controller', () => {
  let req;
  let res;
  let next;
  
  let squadPkSpy, memberFindSpy;

  beforeEach(() => {
    req = { user: { id: 'user-1' }, body: {}, params: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
    vi.clearAllMocks();
    
    squadPkSpy = vi.spyOn(models.StudySquad, 'findByPk').mockResolvedValue(null);
    memberFindSpy = vi.spyOn(models.SquadMember, 'findOne').mockResolvedValue(null);
    
    vi.spyOn(squadService, 'createSquad').mockResolvedValue({});
    vi.spyOn(squadService, 'joinSquad').mockResolvedValue({});
    vi.spyOn(squadService, 'leaveSquad').mockResolvedValue({});
  });

  describe('createSquad', () => {
    it('should create a squad', async () => {
      req.body = { name: 'New Squad' };
      squadService.createSquad.mockResolvedValue({ id: 'squad-1', name: 'New Squad' });

      await squadController.createSquad(req, res, next);

      expect(squadService.createSquad).toHaveBeenCalledWith('user-1', 'New Squad');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 'squad-1', name: 'New Squad' });
    });

    it('should return 400 if name is missing', async () => {
      req.body = {};
      await squadController.createSquad(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Squad name is required' });
    });
  });

  describe('getSquadDashboard', () => {
    it('should return 403 if user is not a member', async () => {
      req.params = { id: 'squad-1' };
      memberFindSpy.mockResolvedValue(null);

      await squadController.getSquadDashboard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authorized to view this squad' });
    });

    it('should return 404 if squad not found', async () => {
      req.params = { id: 'squad-1' };
      memberFindSpy.mockResolvedValue({ role: 'member' });
      squadPkSpy.mockResolvedValue(null);

      await squadController.getSquadDashboard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Squad not found' });
    });

    it('should return squad data if authorized', async () => {
      req.params = { id: 'squad-1' };
      memberFindSpy.mockResolvedValue({ role: 'admin' });
      squadPkSpy.mockResolvedValue({ id: 'squad-1', name: 'Test' });

      await squadController.getSquadDashboard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        squad: { id: 'squad-1', name: 'Test' },
        currentUserRole: 'admin'
      });
    });
  });
});

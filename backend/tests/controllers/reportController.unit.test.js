const { generateStudySummary, generateCertificate } = require('../../controllers/reportController');
const QuizAttempt = require('../../models/QuizAttempt');
const StudyPlan = require('../../models/StudyPlan');
const PDFDocument = require('pdfkit');
describe('reportController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.spyOn(QuizAttempt, 'findAll').mockClear();
    vi.spyOn(StudyPlan, 'findOne').mockClear();
    req = { user: { id: 1, name: 'Test User' }, query: {} };
    res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
      emit: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      removeListener: vi.fn()
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('generateStudySummary', () => {
    it('should handle zero attempts', async () => {
      QuizAttempt.findAll.mockResolvedValue([]);
      req.query.range = '30d';

      await generateStudySummary(req, res, next);

      expect(QuizAttempt.findAll).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    });

    it('should generate summary for valid data', async () => {
      QuizAttempt.findAll.mockResolvedValue([{ score: 10, timeSpent: 30 }, { score: 20, timeSpent: 40 }]);
      req.query.range = 'all';

      await generateStudySummary(req, res, next);

      expect(QuizAttempt.findAll).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('Study_Summary_all.pdf'));
    });
  });

  describe('generateCertificate', () => {
    it('should return 400 if planId is missing', async () => {
      await generateCertificate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'planId is required' });
    });

    it('should return 404 if plan not found', async () => {
      req.query.planId = '123';
      StudyPlan.findOne.mockResolvedValue(null);
      await generateCertificate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Study plan not found' });
    });

    it('should return 403 if plan is incomplete', async () => {
      req.query.planId = '123';
      StudyPlan.findOne.mockResolvedValue({ status: 'active', dailyGoals: [{ completed: false }] });
      await generateCertificate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Cannot generate certificate for an incomplete study plan.' });
    });

    it('should generate certificate if plan is complete', async () => {
      req.query.planId = '123';
      StudyPlan.findOne.mockResolvedValue({ status: 'completed' });
      await generateCertificate(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=Certificate_123.pdf');
    });
  });
});

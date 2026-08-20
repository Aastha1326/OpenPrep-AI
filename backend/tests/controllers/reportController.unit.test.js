const { generateStudySummary, generateCertificate } = require('../../controllers/reportController');
const QuizAttempt = require('../../models/QuizAttempt');
const StudyPlan = require('../../models/StudyPlan');
const PDFDocument = require('pdfkit');
const certificateService = require('../../services/certificateService');

describe('reportController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.spyOn(QuizAttempt, 'findAll').mockClear();
    vi.spyOn(StudyPlan, 'findOne').mockClear();
    vi.spyOn(certificateService, 'generateCertificate').mockClear();
    req = { user: { id: 1, name: 'Test User' }, query: {} };
    res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
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

    it('should generate certificate with default template', async () => {
      req.query.planId = '123';
      const mockCertificateData = {
        recipientName: 'Test User',
        courseName: 'Test Course',
        completionDate: new Date(),
        certificateNumber: 'CERT-2024-ABC123'
      };
      const mockPdfBuffer = Buffer.from('mock pdf content');
      
      certificateService.generateCertificate.mockResolvedValue({
        certificateData: mockCertificateData,
        pdfBuffer: mockPdfBuffer
      });

      await generateCertificate(req, res, next);

      expect(certificateService.generateCertificate).toHaveBeenCalledWith('123', 1, 'default');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('Certificate_'));
      expect(res.send).toHaveBeenCalledWith(mockPdfBuffer);
    });

    it('should generate certificate with custom template', async () => {
      req.query.planId = '123';
      req.query.template = 'modern';
      const mockCertificateData = {
        recipientName: 'Test User',
        courseName: 'Test Course',
        completionDate: new Date(),
        certificateNumber: 'CERT-2024-DEF456'
      };
      const mockPdfBuffer = Buffer.from('mock pdf content');
      
      certificateService.generateCertificate.mockResolvedValue({
        certificateData: mockCertificateData,
        pdfBuffer: mockPdfBuffer
      });

      await generateCertificate(req, res, next);

      expect(certificateService.generateCertificate).toHaveBeenCalledWith('123', 1, 'modern');
    });

    it('should handle certificate service errors', async () => {
      req.query.planId = '123';
      certificateService.generateCertificate.mockRejectedValue(new Error('Study plan is incomplete'));

      await generateCertificate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle unsupported template errors', async () => {
      req.query.planId = '123';
      req.query.template = 'invalid';
      certificateService.generateCertificate.mockRejectedValue(new Error('Unsupported certificate template: invalid'));

      await generateCertificate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

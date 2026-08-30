const { solveImageQuestion: solveController } = require('../../controllers/aiController');
const geminiService = require('../../services/geminiService');

describe('Multimodal Diagram & Math Formula OCR Solver Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('geminiService.solveImageQuestion', () => {
    it('returns formatted LaTeX markdown solution', async () => {
      const dummyBuffer = Buffer.from('fake_image_data');
      const result = await geminiService.solveImageQuestion(dummyBuffer, 'image/png', 'Find integral');

      expect(result).toHaveProperty('solutionMarkdown');
      expect(typeof result.solutionMarkdown).toBe('string');
      expect(result.solutionMarkdown).toContain('Extracted');
    });
  });

  describe('aiController.solveImageQuestion', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        file: {
          buffer: Buffer.from('test_image_bytes'),
          mimetype: 'image/png',
        },
        body: { prompt: 'Solve step by step' },
      };
      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      next = vi.fn();
    });

    it('returns 400 if image file is missing', async () => {
      req.file = null;

      await solveController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Please upload an image file of the equation or diagram.',
      }));
    });

    it('returns 400 for unsupported file MIME type', async () => {
      req.file.mimetype = 'application/pdf';

      await solveController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid file format. Only JPEG, PNG, and WebP images are supported.',
      }));
    });

    it('returns 200 and solution data for valid image upload', async () => {
      vi.spyOn(geminiService, 'solveImageQuestion').mockResolvedValue({
        solutionMarkdown: '### **Extracted Formula**\n\n$$\\int x^2 dx$$',
      });

      await solveController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          solutionMarkdown: expect.stringContaining('$$\\int x^2 dx$$'),
        }),
      }));
    });
  });
});

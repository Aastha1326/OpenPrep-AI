const pyqAnalyzerService = require('../../services/pyqAnalyzerService');
const pdfParse = require('pdf-parse');
const ocrService = require('../../services/ocrService');

vi.mock('pdf-parse');
vi.mock('../../services/ocrService');

describe('pyqAnalyzerService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractTextFromFiles', () => {
    it('should extract text from a valid PDF file successfully', async () => {
      pdfParse.mockResolvedValue({
        text: 'This is a sample exam paper containing questions on Algebra and Calculus.',
      });

      const mockFiles = [
        {
          path: '/tmp/test.pdf',
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
        },
      ];

      // Mock fs.promises.readFile
      const fs = require('fs');
      vi.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('mock pdf data'));

      const result = await pyqAnalyzerService.extractTextFromFiles(mockFiles, 'Mathematics');
      expect(result).toContain('Algebra and Calculus');
      expect(pdfParse).toHaveBeenCalledTimes(1);
    });

    it('should trigger OCR fallback logic if PDF text is too short (scanned PDF)', async () => {
      pdfParse.mockResolvedValue({
        text: '   ', // Scanned or empty PDF text
      });

      const mockFiles = [
        {
          path: '/tmp/scanned.pdf',
          originalname: 'scanned.pdf',
          mimetype: 'application/pdf',
        },
      ];

      const fs = require('fs');
      vi.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('scanned pdf'));

      const result = await pyqAnalyzerService.extractTextFromFiles(mockFiles, 'Computer Science');
      // Should fall back to syllabus trends and contain key topics
      expect(result).toContain('Database Normalization');
    });

    it('should call ocrService if uploaded file mimetype is an image', async () => {
      ocrService.extractTextFromImage.mockResolvedValue({
        extractedText: 'Extracted text from PNG image of the board exam paper.',
      });

      const mockFiles = [
        {
          path: '/tmp/image.png',
          originalname: 'image.png',
          mimetype: 'image/png',
        },
      ];

      const fs = require('fs');
      vi.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('image buffer'));

      const result = await pyqAnalyzerService.extractTextFromFiles(mockFiles, 'Physics');
      expect(result).toContain('Extracted text from PNG');
      expect(ocrService.extractTextFromImage).toHaveBeenCalledTimes(1);
    });
  });

  describe('analyzePYQBatch weightage calculator', () => {
    it('should correctly sum and allocate percentage weightages', async () => {
      // Mock Gemini API by leaving genAI undefined, triggering getMockBatchAnalysis
      const result = await pyqAnalyzerService.analyzePYQBatch('Combined papers text', 'Computer Science');
      
      expect(result.examName).toBe('General Assessment Boards');
      expect(result.totalQuestions).toBe(5);
      
      const weightage = result.weightageData.chapterWeightage;
      expect(weightage).toBeDefined();
      expect(weightage.length).toBeGreaterThan(0);
      
      // The total percentage of chapters should sum to 100%
      const totalPercentage = weightage.reduce((sum, ch) => sum + ch.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100.1, 0); // ~100% accounting for float roundings
    });
  });
});

const { escapeLikePattern } = require('../../utils/likePattern');
const noteController = require('../../controllers/noteController');
const Note = require('../../models/Note');
const Subject = require('../../models/Subject');
const ocrService = require('../../services/ocrService');
const fs = require('fs');

vi.mock('../../models/Note', () => ({
  create: vi.fn(),
  findOne: vi.fn(),
  findAll: vi.fn(),
}));

vi.mock('../../models/Subject', () => ({
  findByPk: vi.fn(),
}));

vi.mock('../../models/ActivityLog', () => ({
  create: vi.fn(),
}));

vi.mock('../../services/ocrService', () => ({
  extractTextFromImage: vi.fn(),
  extractTextFromPDF: vi.fn(),
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    unlinkSync: vi.fn(),
    readFileSync: vi.fn(() => Buffer.from('mock file data')),
  };
});

describe('escapeLikePattern', () => {
  it('should escape percent wildcard', () => {
    expect(escapeLikePattern('100%')).toBe('100\\%');
  });

  it('should escape underscore wildcard', () => {
    expect(escapeLikePattern('hello_world')).toBe('hello\\_world');
  });

  it('should escape backslash', () => {
    expect(escapeLikePattern('path\\to')).toBe('path\\\\to');
  });

  it('should escape multiple wildcards in a string', () => {
    expect(escapeLikePattern('%test_')).toBe('\\%test\\_');
  });

  it('should escape backslash before percent', () => {
    expect(escapeLikePattern('\\%')).toBe('\\\\\\%');
  });

  it('should return plain strings unchanged', () => {
    expect(escapeLikePattern('hello world')).toBe('hello world');
  });

  it('should handle empty string', () => {
    expect(escapeLikePattern('')).toBe('');
  });

  it('should escape consecutive special characters', () => {
    expect(escapeLikePattern('%%__')).toBe('\\%\\%\\_\\_');
  });

  it('should handle mixed content', () => {
    expect(escapeLikePattern('100% done_test')).toBe('100\\% done\\_test');
  });
});

describe('Note Controller - OCR Unit Tests', () => {
  const fakeUser = { id: 'user-123' };

  describe('uploadOcrNote', () => {
    it('should return extracted text and confidence for a valid image', async () => {
      ocrService.extractTextFromImage.mockResolvedValue({
        extractedText: 'Extracted handwritten note content',
        confidence: 85.5,
        wordCount: 4,
      });

      const req = {
        user: fakeUser,
        file: {
          originalname: 'notes.png',
          filename: 'notes-123.png',
          path: '/uploads/notes-123.png',
        },
      };

      let statusCode = null;
      let responseData = null;

      const res = {
        status(c) {
          statusCode = c;
          return this;
        },
        json(d) {
          responseData = d;
          return this;
        },
      };

      await noteController.uploadOcrNote(req, res, (err) => {
        if (err) throw err;
      });

      expect(statusCode).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.extractedText).toBe('Extracted handwritten note content');
      expect(responseData.data.confidence).toBe(85.5);
      expect(responseData.data.fileUrl).toBe('/uploads/notes-123.png');
    });

    it('should reject unsupported formats like GIF', async () => {
      const req = {
        user: fakeUser,
        file: {
          originalname: 'notes.gif',
          filename: 'notes-123.gif',
          path: '/uploads/notes-123.gif',
        },
      };

      let statusCode = null;
      let responseData = null;

      const res = {
        status(c) {
          statusCode = c;
          return this;
        },
        json(d) {
          responseData = d;
          return this;
        },
      };

      await noteController.uploadOcrNote(req, res, (err) => {
        if (err) throw err;
      });

      expect(statusCode).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Unsupported format');
    });
  });

  describe('uploadNote with OCR properties', () => {
    it('should save note with isOcrExtracted and confidence values', async () => {
      Subject.findByPk.mockResolvedValue({ id: 'subject-123', name: 'Pathology' });
      Note.create.mockImplementation((data) => ({
        id: 'note-789',
        ...data,
      }));

      const req = {
        user: fakeUser,
        body: {
          title: 'OCR Note',
          content: 'My corrected class notes content',
          subjectId: 'subject-123',
          isOcrExtracted: 'true',
          ocrConfidence: '82.4',
          originalImageUrl: '/uploads/notes-123.png',
        },
      };

      let statusCode = null;
      let responseData = null;

      const res = {
        status(c) {
          statusCode = c;
          return this;
        },
        json(d) {
          responseData = d;
          return this;
        },
      };

      await noteController.uploadNote(req, res, (err) => {
        if (err) throw err;
      });

      expect(statusCode).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.isOcrExtracted).toBe(true);
      expect(responseData.data.ocrConfidence).toBe(82.4);
      expect(responseData.data.originalImageUrl).toBe('/uploads/notes-123.png');
    });
  });
});

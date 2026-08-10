import { describe, it, expect, beforeEach, vi } from 'vitest';
const {
  validateRequest,
  registerSchema,
  loginSchema,
  createQuizSchema,
  createFlashcardDeckSchema,
  updateStudyTaskSchema,
  updateProfileSchema,
} = require('../../middleware/validate');

describe('Schema Validation Middleware (Zod)', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  describe('registerSchema', () => {
    const middleware = validateRequest(registerSchema);

    it('should pass valid registration payload to next()', async () => {
      req.body = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      };

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email or weak password', async () => {
      req.body = {
        name: 'J',
        email: 'invalid-email',
        password: 'weak',
      };

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
          details: expect.any(Array),
        })
      );
    });

    it('should reject unallowed extra properties with 400 Bad Request', async () => {
      req.body = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        isAdmin: true, // Malicious extra parameter
      };

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Unrecognized key'),
        })
      );
    });
  });

  describe('loginSchema', () => {
    const middleware = validateRequest(loginSchema);

    it('should pass valid login payload to next()', async () => {
      req.body = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should return 400 when password is missing', async () => {
      req.body = {
        email: 'user@example.com',
      };

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('createQuizSchema', () => {
    const middleware = validateRequest(createQuizSchema);

    it('should pass valid quiz creation payload to next()', async () => {
      req.body = {
        subjectId: '11111111-1111-4111-8111-111111111111',
        numQuestions: 10,
        difficulty: 'Medium',
      };

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid UUID subjectId or invalid difficulty', async () => {
      req.body = {
        subjectId: 'not-a-uuid',
        difficulty: 'Impossible',
      };

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject unallowed extra fields on quiz creation', async () => {
      req.body = {
        subjectId: '11111111-1111-4111-8111-111111111111',
        overrideScore: 100, // Extra field
      };

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('createFlashcardDeckSchema', () => {
    const middleware = validateRequest(createFlashcardDeckSchema);

    it('should pass valid flashcard deck creation payload to next()', async () => {
      req.body = {
        subjectId: '11111111-1111-4111-8111-111111111111',
        title: 'Algorithms Deck',
        cards: [
          { front: 'Q1', back: 'A1' },
        ],
      };

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should return 400 when deck title is missing', async () => {
      req.body = {
        subjectId: '11111111-1111-4111-8111-111111111111',
        title: '',
      };

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateStudyTaskSchema', () => {
    const middleware = validateRequest(updateStudyTaskSchema);

    it('should pass valid study task update payload to next()', async () => {
      req.body = {
        completed: true,
        studyTimeMinutes: 45,
      };

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject negative studyTimeMinutes', async () => {
      req.body = {
        studyTimeMinutes: -10,
      };

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateProfileSchema', () => {
    const middleware = validateRequest(updateProfileSchema);

    it('should pass valid profile update payload', async () => {
      req.body = {
        name: 'Updated Name',
        bio: 'Student preparing for exams.',
      };

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});

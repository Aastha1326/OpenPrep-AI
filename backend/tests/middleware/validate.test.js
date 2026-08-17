const { describe, it, expect, vi } = require('vitest');
const { validateRequest, registerSchema, createStudyPlanSchema, submitQuizSchema } = require('../../middleware/validate');

describe('Zod Validation Middleware & Schemas', () => {
  // Test validateRequest middleware behavior
  describe('validateRequest Middleware Utility', () => {
    it('should call next() when request body matches schema', async () => {
      const schema = registerSchema;
      const middleware = validateRequest(schema);
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'StrongPass1!',
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 with field-level details on validation failure', async () => {
      const schema = registerSchema;
      const middleware = validateRequest(schema);
      const req = {
        body: {
          name: 'J', // too short
          email: 'invalid-email',
          password: 'weak',
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
          details: expect.any(Array),
        })
      );
    });
  });

  // Test registerSchema constraints
  describe('registerSchema', () => {
    it('should accept valid registration payloads', async () => {
      const result = await registerSchema.safeParseAsync({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'SecurePass99!',
      });
      expect(result.success).toBe(true);
    });

    it('should reject weak passwords lacking required character types', async () => {
      const result = await registerSchema.safeParseAsync({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'simplepassword',
      });
      expect(result.success).toBe(false);
    });
  });

  // Test createStudyPlanSchema constraints
  describe('createStudyPlanSchema', () => {
    it('should accept valid study plans', async () => {
      const result = await createStudyPlanSchema.safeParseAsync({
        examId: '123e4567-e89b-12d3-a456-426614174000',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        studyHoursPerDay: 2,
      });
      expect(result.success).toBe(true);
    });

    it('should reject study plans where endDate is before/equal to startDate', async () => {
      const result = await createStudyPlanSchema.safeParseAsync({
        examId: '123e4567-e89b-12d3-a456-426614174000',
        startDate: '2024-06-01',
        endDate: '2024-01-01',
      });
      expect(result.success).toBe(false);
    });
  });

  // Test submitQuizSchema constraints
  describe('submitQuizSchema', () => {
    it('should accept valid quiz submissions', async () => {
      const result = await submitQuizSchema.safeParseAsync({
        answers: [
          {
            questionId: '123e4567-e89b-12d3-a456-426614174000',
            selectedAnswer: 'optionA',
          },
        ],
        timeSpent: 120,
      });
      expect(result.success).toBe(true);
    });

    it('should reject quiz submissions with empty answers array', async () => {
      const result = await submitQuizSchema.safeParseAsync({
        answers: [],
      });
      expect(result.success).toBe(false);
    });
  });
});

const { validateGenerateRevisionSheet } = require('../../middleware/validators');
const geminiService = require('../../services/geminiService');

function runValidators(validators, body) {
  return new Promise((resolve) => {
    const req = { body };
    const res = {
      code: null,
      data: null,
      status(c) { this.code = c; return this; },
      json(d) { this.data = d; },
    };

    let idx = 0;
    function next() {
      if (idx >= validators.length || res.code !== null) {
        resolve(res);
        return;
      }
      validators[idx++](req, res, next);
    }

    next();
    setTimeout(() => resolve(res), 1000);
  });
}

describe('Revision Sheet Feature - Unit Tests', () => {
  describe('validateGenerateRevisionSheet', () => {
    it('should pass with empty request body', async () => {
      const res = await runValidators(validateGenerateRevisionSheet, {});
      expect(res.code).toBeNull();
    });

    it('should pass with valid uuid quizAttemptId', async () => {
      const res = await runValidators(validateGenerateRevisionSheet, {
        quizAttemptId: '123e4567-e89b-12d3-a456-426614174000',
        saveToNotes: true,
      });
      expect(res.code).toBeNull();
    });

    it('should reject invalid quizAttemptId', async () => {
      const res = await runValidators(validateGenerateRevisionSheet, {
        quizAttemptId: 'invalid-uuid',
      });
      expect(res.code).toBe(400);
      expect(res.data.error).toContain('quizAttemptId');
    });

    it('should reject non-array mistookQuestions', async () => {
      const res = await runValidators(validateGenerateRevisionSheet, {
        mistookQuestions: 'not-an-array',
      });
      expect(res.code).toBe(400);
      expect(res.data.error).toContain('mistookQuestions');
    });
  });

  describe('geminiService.generateRevisionSheet mock fallback', () => {
    it('should return structured Markdown revision sheet in mock mode', async () => {
      const result = await geminiService.generateRevisionSheet(
        [{ questionText: 'What is O(1)?', userSelectedAnswer: 2 }],
        'Computer Science',
        'Algorithms'
      );

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('summaryMarkdown');
      expect(result.summaryMarkdown).toContain('AI Concept Revision Sheet');
      expect(result.summaryMarkdown).toContain('Computer Science');
    });
  });
});

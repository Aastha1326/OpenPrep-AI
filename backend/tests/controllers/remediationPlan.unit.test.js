const { validateGenerateRemediationPlan } = require('../../middleware/validators');
const geminiService = require('../../services/geminiService');

function runValidators(validators, body) {
  return new Promise((resolve) => {
    const req = { body };
    const res = {
      code: null,
      data: null,
      status(c) {
        this.code = c;
        return this;
      },
      json(d) {
        this.data = d;
      },
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

describe('Remediation Plan Feature - Unit Tests', () => {
  describe('validateGenerateRemediationPlan', () => {
    it('should pass with empty request body', async () => {
      const res = await runValidators(validateGenerateRemediationPlan, {});
      expect(res.code).toBeNull();
    });

    it('should pass with valid uuid quizAttemptId', async () => {
      const res = await runValidators(validateGenerateRemediationPlan, {
        quizAttemptId: '123e4567-e89b-12d3-a456-426614174000',
        saveToNotes: true,
      });
      expect(res.code).toBeNull();
    });

    it('should reject invalid quizAttemptId', async () => {
      const res = await runValidators(validateGenerateRemediationPlan, {
        quizAttemptId: 'invalid-uuid',
      });
      expect(res.code).toBe(400);
      expect(res.data.error).toContain('quizAttemptId');
    });

    it('should reject non-array mistookQuestions', async () => {
      const res = await runValidators(validateGenerateRemediationPlan, {
        mistookQuestions: 'not-an-array',
      });
      expect(res.code).toBe(400);
      expect(res.data.error).toContain('mistookQuestions');
    });

    it('should reject non-array weakTopics', async () => {
      const res = await runValidators(validateGenerateRemediationPlan, {
        weakTopics: 'not-an-array',
      });
      expect(res.code).toBe(400);
      expect(res.data.error).toContain('weakTopics');
    });
  });

  describe('geminiService.generateRemediationPlan mock fallback', () => {
    it('should return a structured 3-day remediation plan in mock mode', async () => {
      const result = await geminiService.generateRemediationPlan(
        [{ questionText: 'What is O(1)?', userSelectedAnswer: 2 }],
        'Computer Science',
        'Algorithms',
        ['Time Complexity']
      );

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('summaryMarkdown');
      expect(result).toHaveProperty('plan');
      expect(result.summaryMarkdown).toContain('3-Day AI Remediation Plan');
      expect(result.summaryMarkdown).toContain('Computer Science');
      expect(result.plan).toHaveLength(3);

      const dayOne = result.plan[0];
      expect(dayOne).toHaveProperty('day', 1);
      expect(dayOne).toHaveProperty('date');
      expect(Array.isArray(dayOne.focusTopics)).toBe(true);
      expect(Array.isArray(dayOne.objectives)).toBe(true);
      expect(Array.isArray(dayOne.tasks)).toBe(true);
      expect(dayOne.tasks.length).toBeGreaterThan(0);
      expect(dayOne.tasks[0]).toHaveProperty('durationMinutes');
      expect(typeof dayOne.estimatedMinutes).toBe('number');
    });

    it('should fall back to weak topic names when provided', async () => {
      const result = await geminiService.generateRemediationPlan([], 'Mathematics', 'Calculus', [
        'Limits',
        'Derivatives',
      ]);

      expect(result.plan).toHaveLength(3);
      expect(result.plan[0].focusTopics).toEqual(expect.arrayContaining(['Limits', 'Derivatives']));
    });
  });
});

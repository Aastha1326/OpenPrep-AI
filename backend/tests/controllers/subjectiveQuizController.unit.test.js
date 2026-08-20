const quizController = require('../../controllers/quizController');
const geminiService = require('../../services/geminiService');
const { validateEvaluateSubjective } = require('../../middleware/validators');

function runMiddleware(middlewareList, req) {
  return new Promise((resolve) => {
    let resolved = false;
    const res = {
      statusCode: 200,
      data: null,
      status(c) {
        this.statusCode = c;
        return this;
      },
      json(d) {
        this.data = d;
        if (!resolved) {
          resolved = true;
          resolve(this);
        }
        return this;
      },
    };

    let idx = 0;
    function next(err) {
      if (resolved) return;
      if (err) {
        res.statusCode = 500;
        res.data = { error: err.message };
        resolved = true;
        return resolve(res);
      }
      if (idx >= middlewareList.length) {
        resolved = true;
        return resolve(res);
      }
      const current = middlewareList[idx++];
      current(req, res, next);
    }

    next();
  });
}

describe('Subjective Quiz Controller - Integration & Unit Tests', () => {
  beforeAll(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('validateEvaluateSubjective Middleware', () => {
    it('should pass validation when valid userAnswerText is provided', async () => {
      const req = {
        body: {
          userAnswerText: 'This is a valid written response for testing purposes.',
        },
      };
      const res = await runMiddleware(validateEvaluateSubjective, req);
      expect(res.statusCode).toBe(200);
      expect(res.data).toBeNull();
    });

    it('should fail validation when userAnswerText is missing or not a string', async () => {
      const req = {
        body: {
          userAnswerText: 12345, // invalid type
        },
      };
      const res = await runMiddleware(validateEvaluateSubjective, req);
      expect(res.statusCode).toBe(400);
      expect(res.data).toBeDefined();
      expect(res.data.success).toBe(false);
      expect(res.data.error).toContain('userAnswerText');
    });
  });

  describe('evaluateSubjectiveAnswer Controller Handler', () => {
    it('should return 200 with structured evaluation data for valid subjective answer', async () => {
      const req = {
        body: {
          questionText: 'Explain the working of gradient descent in machine learning.',
          idealAnswer: 'Gradient descent is an optimization algorithm used to minimize loss by moving in the direction of steepest descent.',
          rubricCriteria: [
            { category: 'Conceptual Accuracy', maxPoints: 3 },
            { category: 'Completeness', maxPoints: 3 },
            { category: 'Key Terminology', maxPoints: 2 },
            { category: 'Clarity', maxPoints: 2 },
          ],
          userAnswerText: 'Gradient descent minimizes the cost function by taking steps proportional to the negative of the gradient of the function at the current point. Learning rate controls step size.',
        },
        query: {},
      };

      let statusResult = null;
      let jsonResult = null;

      const res = {
        status(c) {
          statusResult = c;
          return this;
        },
        json(d) {
          jsonResult = d;
          return this;
        },
      };

      const next = (err) => {
        if (err) throw err;
      };

      await quizController.evaluateSubjectiveAnswer(req, res, next);

      expect(statusResult).toBe(200);
      expect(jsonResult).toBeDefined();
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.data).toHaveProperty('score');
      expect(jsonResult.data).toHaveProperty('rubricScores');
      expect(jsonResult.data).toHaveProperty('keyStrengths');
      expect(jsonResult.data).toHaveProperty('missingKeywords');
      expect(jsonResult.data).toHaveProperty('feedback');
    });

    it('should handle short answers with 0 score and explicit feedback flag', async () => {
      const req = {
        body: {
          questionText: 'Explain gradient descent.',
          idealAnswer: 'Model answer.',
          userAnswerText: 'Too short response.',
        },
        query: {},
      };

      let statusResult = null;
      let jsonResult = null;

      const res = {
        status(c) {
          statusResult = c;
          return this;
        },
        json(d) {
          jsonResult = d;
          return this;
        },
      };

      await quizController.evaluateSubjectiveAnswer(req, res, (err) => {
        if (err) throw err;
      });

      expect(statusResult).toBe(200);
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.data.score).toBe(0);
      expect(jsonResult.data.isOffTopic).toBe(true);
      expect(jsonResult.data.feedback).toContain('minimum 20 words required');
    });
  });
});

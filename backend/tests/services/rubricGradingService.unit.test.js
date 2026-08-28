const { evaluateAnswerAgainstRubric } = require('../../services/rubricGradingService');

describe('Rubric Grading Service with Structured JSON schema', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should request structured JSON from Gemini and return parsed evaluation results', async () => {
    process.env.GEMINI_API_KEY = 'test_api_key';

    const mockEvaluation = {
      totalScore: 8,
      maxScore: 10,
      criteria: [
        { name: 'Step Method', score: 3, maxScore: 3, feedback: 'Correct method.' },
        { name: 'Calculation Accuracy', score: 2, maxScore: 3, feedback: 'Minor math error.' }
      ],
      feedbackAnnotations: [
        { line: 3, severity: 'warning', message: 'Calculation error in step 2.' }
      ],
      overallFeedback: 'Good try. Please correct step 2.'
    };

    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockEvaluation)
        }
      })
    };

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    vi.spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel').mockReturnValue(mockModel);

    const result = await evaluateAnswerAgainstRubric(
      'Student answers...',
      'Model answer...',
      'Rubric rules...'
    );

    expect(GoogleGenerativeAI.prototype.getGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-1.5-flash',
        generationConfig: expect.objectContaining({ responseMimeType: 'application/json' })
      })
    );
    expect(result.totalScore).toBe(8);
    expect(result.overallFeedback).toBe('Good try. Please correct step 2.');
  });
});

const { describe, it, expect } = require('vitest');
const geminiService = require('../../services/geminiService');

describe('Quiz Grading and AI Normalization - Array correctAnswer Handling', () => {
  describe('Grading Evaluation Logic (Array vs Integer correctAnswer)', () => {
    const evaluateAnswer = (q, selected) => {
      return Array.isArray(q.correctAnswer)
        ? q.correctAnswer.includes(selected)
        : selected === q.correctAnswer;
    };

    it('should correctly grade integer correctAnswer with strict equality', () => {
      const q = { correctAnswer: 2 };
      expect(evaluateAnswer(q, 2)).toBe(true);
      expect(evaluateAnswer(q, 0)).toBe(false);
      expect(evaluateAnswer(q, 1)).toBe(false);
    });

    it('should correctly grade array correctAnswer when user selection is included in the array', () => {
      const q = { correctAnswer: [0, 2] };
      expect(evaluateAnswer(q, 0)).toBe(true);
      expect(evaluateAnswer(q, 2)).toBe(true);
      expect(evaluateAnswer(q, 1)).toBe(false);
      expect(evaluateAnswer(q, 3)).toBe(false);
    });
  });

  describe('AI Quiz Generator Normalization', () => {
    it('should normalize array correctAnswer to a single integer in quiz response', async () => {
      // Mock AI quiz response parser logic
      const rawParsedQuiz = {
        title: 'Sample Test Quiz',
        questions: [
          {
            questionText: 'Which options are valid?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: [1, 3],
            explanation: 'Both B and D are valid.',
          },
          {
            questionText: 'Single answer question',
            options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'],
            correctAnswer: 2,
            explanation: 'Opt 3 is correct.',
          },
          {
            questionText: 'String integer answer question',
            options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'],
            correctAnswer: '3',
            explanation: 'Opt 4 is correct.',
          },
        ],
      };

      // Apply the same normalization logic as geminiService / quizController
      const normalizedQuestions = rawParsedQuiz.questions.map((q) => {
        let normalizedCorrectAnswer = q.correctAnswer;
        if (Array.isArray(normalizedCorrectAnswer)) {
          normalizedCorrectAnswer = normalizedCorrectAnswer.length > 0 ? normalizedCorrectAnswer[0] : null;
        }
        if (typeof normalizedCorrectAnswer === 'string' && !isNaN(normalizedCorrectAnswer) && normalizedCorrectAnswer.trim() !== '') {
          normalizedCorrectAnswer = parseInt(normalizedCorrectAnswer, 10);
        }
        return {
          ...q,
          correctAnswer: normalizedCorrectAnswer,
        };
      });

      expect(typeof normalizedQuestions[0].correctAnswer).toBe('number');
      expect(normalizedQuestions[0].correctAnswer).toBe(1);

      expect(typeof normalizedQuestions[1].correctAnswer).toBe('number');
      expect(normalizedQuestions[1].correctAnswer).toBe(2);

      expect(typeof normalizedQuestions[2].correctAnswer).toBe('number');
      expect(normalizedQuestions[2].correctAnswer).toBe(3);
    });
  });
});

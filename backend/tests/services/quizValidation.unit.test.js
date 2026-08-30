const quizValidationService = require('../../services/quizValidationService');

describe('Quiz Validation Service', () => {
  const mockSourceContext = `
    Photosynthesis is the process by which plants convert sunlight into chemical energy.
    It occurs in chloroplasts and involves two main stages: light-dependent and light-independent reactions.
    The light-dependent reactions occur in the thylakoid membrane and produce ATP and NADPH.
  `;

  describe('Schema Validation', () => {
    it('should reject malformed JSON', () => {
      const result = quizValidationService.validateSchema(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should reject missing required fields', () => {
      const question = { text: 'What is X?', options: ['A', 'B'] };
      const result = quizValidationService.validateSchema(question);
      expect(result.isValid).toBe(false);
    });

    it('should accept valid schema', () => {
      const question = {
        text: 'What is photosynthesis?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: 'It is the conversion of light to chemical energy.',
      };
      const result = quizValidationService.validateSchema(question);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Answer Key Validation', () => {
    const validQuestion = {
      text: 'What is X?',
      options: ['Option A', 'Option B', 'Option C'],
      correctAnswer: 'Option A',
      explanation: 'Because...',
    };

    it('should reject answer not in options', () => {
      const question = { ...validQuestion, correctAnswer: 'Option D' };
      const result = quizValidationService.validateAnswerKey(question);
      expect(result.isValid).toBe(false);
    });

    it('should accept valid single answer', () => {
      const result = quizValidationService.validateAnswerKey(validQuestion);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect exact duplicates', () => {
      const newQuestion = { text: 'What is photosynthesis?' };
      const existing = [{ text: 'What is photosynthesis?' }];
      const result = quizValidationService.detectDuplicates(newQuestion, existing);
      expect(result.isValid).toBe(false);
    });

    it('should detect near-duplicates', () => {
      const newQuestion = { text: 'Define photosynthesis' };
      const existing = [{ text: 'What is photosynthesis?' }];
      const result = quizValidationService.detectDuplicates(newQuestion, existing);
      expect(result.isValid).toBe(true); // High similarity but not exact
    });

    it('should allow unique questions', () => {
      const newQuestion = { text: 'What is cellular respiration?' };
      const existing = [{ text: 'What is photosynthesis?' }];
      const result = quizValidationService.detectDuplicates(newQuestion, existing);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Explanation Consistency', () => {
    it('should reject brief explanations', () => {
      const question = {
        text: 'What is X?',
        explanation: 'Yes',
      };
      const result = quizValidationService.validateExplanationConsistency(
        question,
        ''
      );
      expect(result.isValid).toBe(false);
    });

    it('should accept grounded explanations', () => {
      const question = {
        text: 'What is photosynthesis?',
        explanation:
          'Photosynthesis is the process where plants convert sunlight into chemical energy through light-dependent reactions.',
      };
      const result = quizValidationService.validateExplanationConsistency(
        question,
        mockSourceContext
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('Distractor Quality', () => {
    const baseQuestion = {
      text: 'What is X?',
      correctAnswer: 'Correct',
      explanation: 'Because...',
    };

    it('should reject questions with empty distractors', () => {
      const question = {
        ...baseQuestion,
        options: ['Correct', ''],
      };
      const result = quizValidationService.validateDistractorQuality(question);
      expect(result.isValid).toBe(false);
    });

    it('should reject duplicate distractors', () => {
      const question = {
        ...baseQuestion,
        options: ['Correct', 'Wrong', 'Wrong'],
      };
      const result = quizValidationService.validateDistractorQuality(question);
      expect(result.isValid).toBe(false);
    });

    it('should accept quality distractors', () => {
      const question = {
        ...baseQuestion,
        options: ['Correct', 'Wrong A', 'Wrong B', 'Wrong C'],
      };
      const result = quizValidationService.validateDistractorQuality(question);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Factual Claims Validation', () => {
    it('should detect contradictions with source', () => {
      const question = {
        text: 'Photosynthesis does NOT occur in chloroplasts?',
        explanation: 'Because chloroplasts are not involved.',
      };
      const result = quizValidationService.validateFactualClaims(
        question,
        mockSourceContext
      );
      expect(result.isValid).toBe(false);
    });

    it('should accept grounded factual claims', () => {
      const question = {
        text: 'Where does photosynthesis occur?',
        explanation: 'Photosynthesis occurs in chloroplasts.',
      };
      const result = quizValidationService.validateFactualClaims(
        question,
        mockSourceContext
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('Complete Validation Pipeline', () => {
    it('should validate a complete valid question', async () => {
      const question = {
        text: 'Where does photosynthesis occur?',
        options: ['In chloroplasts', 'In mitochondria', 'In nucleus', 'In ribosome'],
        correctAnswer: 'In chloroplasts',
        explanation: 'Photosynthesis occurs in chloroplasts as stated in the source material.',
        difficulty: 'easy',
        category: 'Biology',
      };

      const result = await quizValidationService.validateQuestion(
        question,
        'quiz-123',
        { sourceContext: mockSourceContext, existingQuestions: [] }
      );

      expect(result.isValid).toBe(true);
      expect(result.passedStages).toBe(result.totalStages);
    });
  });
});
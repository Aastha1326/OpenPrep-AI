const {
  startSession,
  submitAnswer,
  getScoreReport,
  calculate3PLProbability,
  updateAbilityTheta,
  calculateFisherInformation,
} = require('../../services/adaptiveTestingService');

describe('Computer Adaptive Testing (CAT) IRT Engine Unit Tests', () => {
  describe('IRT 3PL Math Calculations', () => {
    it('calculates 3PL probability accurately', () => {
      const prob = calculate3PLProbability(0.0, 1.2, 0.0, 0.25);
      expect(prob).toBeGreaterThan(0.5);
      expect(prob).toBeLessThan(1.0);
    });

    it('increases ability estimate theta on correct answer', () => {
      const initialTheta = 0.0;
      const updatedTheta = updateAbilityTheta(initialTheta, true, 1.2, 0.0, 0.25);
      expect(updatedTheta).toBeGreaterThan(initialTheta);
    });

    it('decreases ability estimate theta on incorrect answer', () => {
      const initialTheta = 0.0;
      const updatedTheta = updateAbilityTheta(initialTheta, false, 1.2, 0.0, 0.25);
      expect(updatedTheta).toBeLessThan(initialTheta);
    });

    it('calculates Fisher Information > 0', () => {
      const info = calculateFisherInformation(0.0, 1.2, 0.0, 0.25);
      expect(info).toBeGreaterThan(0);
    });
  });

  describe('Adaptive Exam Session Workflow', () => {
    it('starts an adaptive session with baseline theta = 0.0', () => {
      const session = startSession('user-1', 'math', 5);

      expect(session).toHaveProperty('sessionId');
      expect(session.currentTheta).toBe(0.0);
      expect(session.currentStep).toBe(1);
      expect(session.currentQuestion).toHaveProperty('id');
    });

    it('adapts difficulty question-by-question upon answer submission', () => {
      const session = startSession('user-2', 'physics', 5);
      const q1Id = session.currentQuestion.id;

      const stepResult = submitAnswer(session.sessionId, q1Id, 0, 15); // Submit correct option index 0

      expect(stepResult.isCorrect).toBe(true);
      expect(stepResult.newTheta).toBeGreaterThan(stepResult.oldTheta);
      expect(stepResult.nextQuestion).toHaveProperty('id');
      expect(stepResult.nextQuestion.id).not.toBe(q1Id);
    });

    it('completes session and generates percentile score report after max questions', () => {
      const session = startSession('user-3', 'chemistry', 2);

      const res1 = submitAnswer(session.sessionId, session.currentQuestion.id, 0, 10);
      expect(res1.isCompleted).toBe(false);

      const res2 = submitAnswer(session.sessionId, res1.nextQuestion.id, 0, 10);
      expect(res2.isCompleted).toBe(true);
      expect(res2).toHaveProperty('scoreReport');
      expect(res2.scoreReport).toHaveProperty('percentile');
      expect(res2.scoreReport.percentile).toBeGreaterThanOrEqual(0);
      expect(res2.scoreReport.percentile).toBeLessThanOrEqual(100);
    });
  });
});

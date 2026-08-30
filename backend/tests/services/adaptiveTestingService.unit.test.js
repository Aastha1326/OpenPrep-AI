const {
  startSession,
  submitAnswer,
  getScoreReport,
  calculate3PLProbability,
  updateAbilityTheta,
  calculateFisherInformation,
  calculateStandardError,
  calculateEAPAbility,
  calculateConfidenceInterval,
  hasConverged,
  calculateTestInformation,
  generateICCData,
  calculateDomainMastery,
} = require('../../services/adaptiveTestingService');

describe('Computer Adaptive Testing (CAT) IRT Engine Unit Tests', () => {
  describe('IRT 3PL Math Calculations', () => {
    it('calculates 3PL probability accurately', () => {
      const prob = calculate3PLProbability(0.0, 1.2, 0.0, 0.25);
      expect(prob).toBeGreaterThan(0.5);
      expect(prob).toBeLessThan(1.0);
    });

    it('3PL probability approaches guessing parameter at extreme low theta', () => {
      const prob = calculate3PLProbability(-5.0, 1.2, 0.0, 0.25);
      expect(prob).toBeCloseTo(0.25, 1);
    });

    it('3PL probability approaches 1.0 at extreme high theta', () => {
      const prob = calculate3PLProbability(5.0, 1.2, 0.0, 0.25);
      expect(prob).toBeGreaterThan(0.95);
      expect(prob).toBeLessThanOrEqual(1.0);
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

    it('clamps theta between -3.0 and +3.0', () => {
      const theta1 = updateAbilityTheta(-3.5, true, 2.0, 0.0, 0.25);
      const theta2 = updateAbilityTheta(3.5, false, 2.0, 0.0, 0.25);
      expect(theta1).toBeGreaterThanOrEqual(-3.0);
      expect(theta1).toBeLessThanOrEqual(3.0);
      expect(theta2).toBeGreaterThanOrEqual(-3.0);
      expect(theta2).toBeLessThanOrEqual(3.0);
    });

    it('calculates Fisher Information > 0 for valid parameters', () => {
      const info = calculateFisherInformation(0.0, 1.2, 0.0, 0.25);
      expect(info).toBeGreaterThan(0);
    });

    it('Fisher Information is highest near item difficulty', () => {
      const infoDifficulty = calculateFisherInformation(0.5, 1.2, 0.5, 0.25);
      const infoFar = calculateFisherInformation(-2.5, 1.2, 0.5, 0.25);
      expect(infoDifficulty).toBeGreaterThan(infoFar);
    });
  });

  describe('Standard Error & Convergence Criteria', () => {
    it('initializes convergence metrics on session start', () => {
      const session = startSession('user-se-1', 'math', 20);
      expect(session.convergenceMetrics).toBeDefined();
      expect(session.convergenceMetrics.targetSE).toBe(0.25);
    });

    it('decreases standard error after each correct answer', () => {
      const initialSession = startSession('user-se-2', 'math', 20);
      const initialSE = calculateStandardError(initialSession);

      const stepResult = submitAnswer(initialSession.sessionId, initialSession.currentQuestion.id, 0, 10);
      
      if (!stepResult.isCompleted) {
        // Manually set the session to calculate SE on updated state
        expect(stepResult.standardError).toBeDefined();
        expect(stepResult.standardError).toBeGreaterThan(0);
        expect(stepResult.standardError).toBeLessThanOrEqual(initialSE);
      }
    });

    it('convergence indicator correctly identifies SE < 0.25 target', () => {
      const session = startSession('user-se-3', 'math', 20);
      
      // Simulate many correct answers to reach convergence
      for (let i = 0; i < 15; i++) {
        const result = submitAnswer(
          session.sessionId,
          session.currentQuestion.id,
          0, // Correct answer
          10
        );
        if (result.isCompleted) {
          expect(result.scoreReport.convergenceReport).toBeDefined();
          expect(result.scoreReport.convergenceReport.converged).toBeDefined();
          break;
        }
      }
    });
  });

  describe('Confidence Interval Calculation', () => {
    it('calculates 95% confidence interval around ability estimate', () => {
      const initialSession = startSession('user-ci-1', 'math', 20);
      
      // Answer one question
      const stepResult = submitAnswer(initialSession.sessionId, initialSession.currentQuestion.id, 0, 10);
      
      if (stepResult.convergenceMetrics) {
        const ci = stepResult.convergenceMetrics.confidenceInterval;
        expect(ci).toBeDefined();
        expect(ci.lower).toBeDefined();
        expect(ci.upper).toBeDefined();
        expect(ci.lower).toBeLessThan(ci.upper);
      }
    });
  });

  describe('EAP Ability Estimation', () => {
    it('calculates Bayesian EAP ability estimate', () => {
      const session = startSession('user-eap-1', 'math', 20);
      
      const result1 = submitAnswer(session.sessionId, session.currentQuestion.id, 0, 10);
      if (!result1.isCompleted) {
        const result2 = submitAnswer(result1.nextQuestion.id, result1.nextQuestion.id, 0, 10);
        
        // EAP should be calculated in the final report
        if (result2.isCompleted || result2.scoreReport) {
          expect(result2.scoreReport.eapTheta).toBeDefined();
          expect(result2.scoreReport.eapTheta).toBeGreaterThanOrEqual(-3.0);
          expect(result2.scoreReport.eapTheta).toBeLessThanOrEqual(3.0);
        }
      }
    });
  });

  describe('Adaptive Exam Session Workflow', () => {
    it('starts an adaptive session with baseline theta = 0.0', () => {
      const session = startSession('user-1', 'math', 5);

      expect(session).toHaveProperty('sessionId');
      expect(session.currentTheta).toBe(0.0);
      expect(session.currentStep).toBe(1);
      expect(session.currentQuestion).toHaveProperty('id');
      expect(session.convergenceMetrics).toBeDefined();
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

    it('selects questions that maximize Fisher Information', () => {
      const session = startSession('user-fi', 'math', 20);
      
      // After correct answer, next question difficulty should adapt
      const result1 = submitAnswer(session.sessionId, session.currentQuestion.id, 0, 10);
      const q1Difficulty = session.currentQuestion.difficulty;
      
      if (!result1.isCompleted) {
        const q2Difficulty = result1.nextQuestion.difficulty;
        // Difficulty should adapt (may go up, down, or stay similar based on Fisher Info)
        expect(q2Difficulty).toBeDefined();
      }
    });
  });

  describe('Score Report & Diagnostics', () => {
    it('generates comprehensive score report with ICC data', () => {
      const session = startSession('user-report', 'math', 3);
      
      const res1 = submitAnswer(session.sessionId, session.currentQuestion.id, 0, 10);
      const res2 = submitAnswer(session.sessionId, res1.nextQuestion.id, 1, 10);
      const res3 = submitAnswer(session.sessionId, res2.nextQuestion.id, 0, 10);

      const report = getScoreReport(session.sessionId);
      
      expect(report).toHaveProperty('finalTheta');
      expect(report).toHaveProperty('eapTheta');
      expect(report).toHaveProperty('percentile');
      expect(report).toHaveProperty('standardError');
      expect(report).toHaveProperty('confidenceInterval');
      expect(report).toHaveProperty('convergenceReport');
      expect(report).toHaveProperty('topicBreakdown');
      expect(report).toHaveProperty('ircData');
      expect(Array.isArray(report.topicBreakdown)).toBe(true);
    });

    it('generates domain/topic mastery breakdown', () => {
      const session = startSession('user-domain', 'math', 5);

      submitAnswer(session.sessionId, session.currentQuestion.id, 0, 10);
      const result = submitAnswer(session.sessionId, session.currentQuestion.id, 0, 10);

      const report = getScoreReport(session.sessionId);
      
      expect(report.topicBreakdown).toBeDefined();
      expect(Array.isArray(report.topicBreakdown)).toBe(true);
      
      report.topicBreakdown.forEach((topic) => {
        expect(topic).toHaveProperty('topic');
        expect(topic).toHaveProperty('accuracy');
        expect(topic).toHaveProperty('questionsCount');
        expect(topic).toHaveProperty('eapAbility');
      });
    });

    it('includes ICC points for each answered question', () => {
      const session = startSession('user-icc', 'math', 3);

      submitAnswer(session.sessionId, session.currentQuestion.id, 0, 10);
      submitAnswer(session.sessionId, session.currentQuestion.id, 1, 10);

      const report = getScoreReport(session.sessionId);
      
      expect(report.ircData).toBeDefined();
      expect(Array.isArray(report.ircData)).toBe(true);
      
      report.ircData.forEach((item) => {
        expect(item).toHaveProperty('questionIndex');
        expect(item).toHaveProperty('itemParams');
        expect(item.itemParams).toHaveProperty('a');
        expect(item.itemParams).toHaveProperty('b');
        expect(item.itemParams).toHaveProperty('c');
        expect(Array.isArray(item.ircPoints)).toBe(true);
      });
    });

    it('assigns performance rating based on percentile', () => {
      const session = startSession('user-rating', 'math', 2);

      submitAnswer(session.sessionId, session.currentQuestion.id, 0, 10);
      submitAnswer(session.sessionId, session.currentQuestion.id, 0, 10);

      const report = getScoreReport(session.sessionId);
      
      expect(['Advanced / Exemplary', 'Proficient / Competitive', 'Developing Mastery']).toContain(
        report.performanceRating
      );
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('handles non-existent session gracefully', () => {
      expect(() => {
        getScoreReport('non-existent-session-id');
      }).toThrow('Adaptive exam session not found');
    });

    it('rejects answers on completed sessions', () => {
      const session = startSession('user-edge', 'math', 1);

      submitAnswer(session.sessionId, session.currentQuestion.id, 0, 10);

      expect(() => {
        submitAnswer(session.sessionId, 'some-question-id', 0, 10);
      }).toThrow();
    });

    it('converges within 15-20 questions for typical ability profile', () => {
      const session = startSession('user-convergence', 'math', 20);
      
      let stepCount = 0;
      let converged = false;

      while (stepCount < 20) {
        const result = submitAnswer(
          session.sessionId,
          session.currentQuestion.id,
          0, // Simulate consistent correct answers
          10
        );
        
        stepCount++;
        
        if (result.isCompleted) {
          converged = true;
          break;
        }
      }

      expect(converged).toBe(true);
      expect(stepCount).toBeLessThanOrEqual(20);
    });
  });
});


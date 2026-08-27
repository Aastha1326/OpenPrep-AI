/**
 * Adaptive Diagnostic Exam Simulation & Item Response Theory (IRT) Engine Unit Test Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AdaptiveDiagnosticExamEngine,
  ExamQuestionItem,
  ExamSessionState,
} from './AdaptiveDiagnosticExamEngine';

describe('AdaptiveDiagnosticExamEngine', () => {
  let engine: AdaptiveDiagnosticExamEngine;

  const mockQuestionPool: ExamQuestionItem[] = [
    { questionId: 'Q1', difficultyTheta: -1.5, discrimination: 1.2, topicCategory: 'Cardiology', prompt: 'S1 S2 heart sound origin?' },
    { questionId: 'Q2', difficultyTheta: 0.0, discrimination: 1.5, topicCategory: 'Cardiology', prompt: 'Mechanism of action of Enalapril?' },
    { questionId: 'Q3', difficultyTheta: 1.5, discrimination: 1.8, topicCategory: 'Cardiology', prompt: 'Management of refractory ventricular tachycardia?' },
    { questionId: 'Q4', difficultyTheta: -0.5, discrimination: 1.1, topicCategory: 'Pulmonology', prompt: 'FEV1/FVC ratio in COPD?' },
    { questionId: 'Q5', difficultyTheta: 1.0, discrimination: 1.4, topicCategory: 'Pulmonology', prompt: 'Idiopathic pulmonary fibrosis HRCT findings?' },
  ];

  beforeEach(() => {
    engine = new AdaptiveDiagnosticExamEngine(mockQuestionPool);
  });

  it('should initialize candidate session with default theta score of 0.0', () => {
    const session = engine.initializeExamSession('CAND-881', 'USMLE-STEP-1');
    expect(session).toBeDefined();
    expect(session.currentAbilityTheta).toBe(0.0);
    expect(session.answeredQuestions.length).toBe(0);
  });

  it('should select next question closest to candidate ability theta', () => {
    const session = engine.initializeExamSession('CAND-881', 'USMLE-STEP-1');
    const nextQ = engine.selectNextOptimalQuestion(session);

    expect(nextQ).toBeDefined();
    expect(nextQ?.questionId).toBe('Q2'); // Q2 difficultyTheta (0.0) matches candidate theta (0.0)
  });

  it('should update candidate ability theta upward after correct answer', () => {
    const session = engine.initializeExamSession('CAND-881', 'USMLE-STEP-1');
    const q = mockQuestionPool[1]; // Q2 theta = 0.0

    const updatedSession = engine.recordQuestionResponse(session, q, true, 45);

    expect(updatedSession.currentAbilityTheta).toBeGreaterThan(0.0); // Ability increases
    expect(updatedSession.answeredQuestions.length).toBe(1);
    expect(updatedSession.answeredQuestions[0].isCorrect).toBe(true);
  });

  it('should update candidate ability theta downward after incorrect answer', () => {
    const session = engine.initializeExamSession('CAND-881', 'USMLE-STEP-1');
    const q = mockQuestionPool[1];

    const updatedSession = engine.recordQuestionResponse(session, q, false, 60);

    expect(updatedSession.currentAbilityTheta).toBeLessThan(0.0); // Ability decreases
  });

  it('should generate comprehensive candidate performance diagnostic report', () => {
    let session = engine.initializeExamSession('CAND-881', 'USMLE-STEP-1');
    session = engine.recordQuestionResponse(session, mockQuestionPool[0], true, 30);
    session = engine.recordQuestionResponse(session, mockQuestionPool[1], true, 50);
    session = engine.recordQuestionResponse(session, mockQuestionPool[4], false, 70);

    const report = engine.generateDiagnosticReport(session);

    expect(report).toBeDefined();
    expect(report.candidateId).toBe('CAND-881');
    expect(report.scaledScorePercentile).toBeGreaterThan(0);
    expect(report.topicBreakdown.length).toBeGreaterThan(0);
  });
});

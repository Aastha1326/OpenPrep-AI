/**
 * Adaptive Diagnostic Exam Simulation Dashboard Component
 */

import React, { useState } from 'react';
import {
  AdaptiveDiagnosticExamEngine,
  ExamQuestionItem,
  ExamSessionState,
} from '../utils/AdaptiveDiagnosticExamEngine';

const MOCK_QUESTION_BANK: ExamQuestionItem[] = [
  { questionId: 'Q-CARD-1', difficultyTheta: -1.0, discrimination: 1.4, topicCategory: 'Cardiology', prompt: 'Which antiarrhythmic drug causes drug-induced lupus erythematosus?' },
  { questionId: 'Q-CARD-2', difficultyTheta: 0.5, discrimination: 1.8, topicCategory: 'Cardiology', prompt: 'What is the diagnostic hallmark of acute pericarditis on ECG?' },
  { questionId: 'Q-PULM-1', difficultyTheta: -0.5, discrimination: 1.2, topicCategory: 'Pulmonology', prompt: 'What arterial blood gas abnormality is expected in acute hyperventilation?' },
  { questionId: 'Q-PULM-2', difficultyTheta: 1.2, discrimination: 1.9, topicCategory: 'Pulmonology', prompt: 'What is the first-line maintenance therapy for moderate persistent asthma?' },
];

export default function AdaptiveDiagnosticExamDashboard() {
  const [engine] = useState(() => new AdaptiveDiagnosticExamEngine(MOCK_QUESTION_BANK));
  const [session, setSession] = useState<ExamSessionState>(() =>
    engine.initializeExamSession('CAND-901', 'USMLE-STEP-1')
  );
  const [currentQuestion, setCurrentQuestion] = useState<ExamQuestionItem | null>(() =>
    engine.selectNextOptimalQuestion(session)
  );

  const report = engine.generateDiagnosticReport(session);

  const handleAnswer = (isCorrect: boolean) => {
    if (!currentQuestion) return;
    const updated = engine.recordQuestionResponse(session, currentQuestion, isCorrect, 45);
    setSession(updated);

    const nextQ = engine.selectNextOptimalQuestion(updated);
    setCurrentQuestion(nextQ);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#F8FAFC' }}>
      <header style={{ marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '16px' }}>
        <h1 style={{ color: '#2563EB', margin: 0 }}>📊 Adaptive Computerized Diagnostic Exam Simulation</h1>
        <p style={{ color: '#64748B', marginTop: '6px' }}>
          Item Response Theory (2PL IRT) real-time candidate theta estimation, Fisher Information optimal item selection, and percentile scoring.
        </p>
      </header>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #2563EB' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Estimated Ability (Theta)</span>
          <h2 style={{ color: '#2563EB', margin: '4px 0 0 0' }}>{session.currentAbilityTheta}</h2>
          <small style={{ color: '#64748B' }}>Scale: -3.0 to +3.0</small>
        </div>

        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #16A34A' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Estimated Percentile</span>
          <h2 style={{ color: '#16A34A', margin: '4px 0 0 0' }}>{report.scaledScorePercentile}th Percentile</h2>
          <small style={{ color: '#64748B' }}>Overall Accuracy: {report.overallAccuracyPercent}%</small>
        </div>

        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #D97706' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Questions Attempted</span>
          <h2 style={{ color: '#D97706', margin: '4px 0 0 0' }}>{session.answeredQuestions.length} Items</h2>
          <small style={{ color: '#64748B' }}>CAT Adaptive Pool</small>
        </div>
      </div>

      {/* Active Question Panel */}
      {currentQuestion ? (
        <div style={{ background: '#FFF', padding: '28px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', maxWidth: '650px', margin: '0 auto' }}>
          <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
            Topic: {currentQuestion.topicCategory} | Difficulty (b): {currentQuestion.difficultyTheta} | Discrimination (a): {currentQuestion.discrimination}
          </span>

          <h3 style={{ margin: '20px 0 24px 0', color: '#1E293B' }}>{currentQuestion.prompt}</h3>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={() => handleAnswer(true)}
              style={{ padding: '10px 24px', background: '#16A34A', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              Correct Response
            </button>
            <button
              onClick={() => handleAnswer(false)}
              style={{ padding: '10px 24px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              Incorrect Response
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: '#FFF', padding: '32px', borderRadius: '10px', textAlign: 'center' }}>
          <h3 style={{ color: '#16A34A' }}>🎉 Computerized Adaptive Test Completed!</h3>
          <p style={{ color: '#64748B' }}>Final Ability Score: {session.currentAbilityTheta} ({report.scaledScorePercentile}th Percentile)</p>
        </div>
      )}
    </div>
  );
}

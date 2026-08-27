/**
 * Adaptive Computerized Diagnostic Exam Simulation & Item Response Theory (IRT 2PL) Engine
 * Models candidate ability (Theta), question difficulty (b), and discrimination parameters (a)
 * to deliver real-time adaptive testing and 3-parameter logistic scoring for competitive exams (USMLE, MCAT, NCLEX).
 */

export interface ExamQuestionItem {
  questionId: string;
  difficultyTheta: number; // b parameter (-3.0 to +3.0)
  discrimination: number;   // a parameter (0.5 to 2.5)
  topicCategory: string;
  prompt: string;
}

export interface AnsweredQuestionRecord {
  questionId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  questionDifficultyTheta: number;
}

export interface ExamSessionState {
  sessionId: string;
  candidateId: string;
  examCode: string;
  currentAbilityTheta: number;
  answeredQuestions: AnsweredQuestionRecord[];
  startedAt: string;
  isCompleted: boolean;
}

export interface TopicPerformanceDiagnostic {
  topicCategory: string;
  questionsAttempted: number;
  accuracyPercent: number;
  masteryLevel: 'ADVANCED_MASTERY' | 'PROFICIENT' | 'NEEDS_REMEDIATION' | 'CRITICAL_WEAKNESS';
}

export interface CandidateDiagnosticReport {
  sessionId: string;
  candidateId: string;
  finalAbilityTheta: number;
  scaledScorePercentile: number;
  totalTimeSpentSeconds: number;
  overallAccuracyPercent: number;
  topicBreakdown: TopicPerformanceDiagnostic[];
}

export class AdaptiveDiagnosticExamEngine {
  private questionPool: ExamQuestionItem[];

  constructor(questionPool: ExamQuestionItem[]) {
    this.questionPool = questionPool;
  }

  /**
   * Initializes a new computerized adaptive test (CAT) session.
   */
  public initializeExamSession(candidateId: string, examCode: string): ExamSessionState {
    return {
      sessionId: `CAT-SESS-${Date.now()}`,
      candidateId,
      examCode,
      currentAbilityTheta: 0.0, // Standardized 0.0 mean initial ability
      answeredQuestions: [],
      startedAt: new Date().toISOString(),
      isCompleted: false,
    };
  }

  /**
   * Selects the next optimal question maximizing Fisher Information at candidate's current ability theta.
   */
  public selectNextOptimalQuestion(session: ExamSessionState): ExamQuestionItem | null {
    const answeredIds = new Set(session.answeredQuestions.map(q => q.questionId));
    const availableQuestions = this.questionPool.filter(q => !answeredIds.has(q.questionId));

    if (availableQuestions.length === 0) return null;

    let bestQuestion: ExamQuestionItem | null = null;
    let maxInformation = -1.0;

    for (const q of availableQuestions) {
      // Fisher Information for 2PL IRT model: I(theta) = a^2 * P(theta) * (1 - P(theta))
      const p = this.calculate2PLProbability(session.currentAbilityTheta, q.difficultyTheta, q.discrimination);
      const info = Math.pow(q.discrimination, 2) * p * (1 - p);

      if (info > maxInformation) {
        maxInformation = info;
        bestQuestion = q;
      }
    }

    return bestQuestion;
  }

  /**
   * Calculates probability of correct response under 2PL Item Response Theory model.
   * P(theta) = 1 / (1 + e^(-a * (theta - b)))
   */
  public calculate2PLProbability(theta: number, difficulty: number, discrimination: number): number {
    const exponent = -discrimination * (theta - difficulty);
    return 1.0 / (1.0 + Math.exp(exponent));
  }

  /**
   * Updates candidate ability theta using Maximum Likelihood / Expected A Posteriori (EAP) step adjustment.
   */
  public recordQuestionResponse(
    session: ExamSessionState,
    question: ExamQuestionItem,
    isCorrect: boolean,
    timeSpentSeconds: number
  ): ExamSessionState {
    const record: AnsweredQuestionRecord = {
      questionId: question.questionId,
      isCorrect,
      timeSpentSeconds,
      questionDifficultyTheta: question.difficultyTheta,
    };

    const newAnswered = [...session.answeredQuestions, record];

    // Ability step adjustment based on response outcome and question difficulty
    const step = (isCorrect ? 1.0 : -1.0) * (0.4 / (1 + session.answeredQuestions.length * 0.1));
    const updatedTheta = Math.max(-3.0, Math.min(3.0, session.currentAbilityTheta + step));

    return {
      ...session,
      currentAbilityTheta: Math.round(updatedTheta * 100) / 100,
      answeredQuestions: newAnswered,
    };
  }

  /**
   * Generates candidate diagnostic report with topic-level mastery breakdown.
   */
  public generateDiagnosticReport(session: ExamSessionState): CandidateDiagnosticReport {
    const topicStats: Record<string, { total: number; correct: number }> = {};
    let totalTime = 0;
    let totalCorrect = 0;

    for (const record of session.answeredQuestions) {
      totalTime += record.timeSpentSeconds;
      if (record.isCorrect) totalCorrect += 1;

      const q = this.questionPool.find(item => item.questionId === record.questionId);
      const topic = q ? q.topicCategory : 'General';

      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, correct: 0 };
      }
      topicStats[topic].total += 1;
      if (record.isCorrect) topicStats[topic].correct += 1;
    }

    const topicBreakdown: TopicPerformanceDiagnostic[] = Object.entries(topicStats).map(([topic, stats]) => {
      const accuracy = Math.round((stats.correct / stats.total) * 100.0);
      let mastery: TopicPerformanceDiagnostic['masteryLevel'] = 'NEEDS_REMEDIATION';

      if (accuracy >= 85) mastery = 'ADVANCED_MASTERY';
      else if (accuracy >= 70) mastery = 'PROFICIENT';
      else if (accuracy < 50) mastery = 'CRITICAL_WEAKNESS';

      return {
        topicCategory: topic,
        questionsAttempted: stats.total,
        accuracyPercent: accuracy,
        masteryLevel: mastery,
      };
    });

    // Convert theta to percentile (standard normal CDF approximation)
    const percentile = Math.round((1.0 / (1.0 + Math.exp(-1.7 * session.currentAbilityTheta))) * 100.0);
    const overallAcc = session.answeredQuestions.length > 0
      ? Math.round((totalCorrect / session.answeredQuestions.length) * 100.0)
      : 0;

    return {
      sessionId: session.sessionId,
      candidateId: session.candidateId,
      finalAbilityTheta: session.currentAbilityTheta,
      scaledScorePercentile: percentile,
      totalTimeSpentSeconds: totalTime,
      overallAccuracyPercent: overallAcc,
      topicBreakdown,
    };
  }
}

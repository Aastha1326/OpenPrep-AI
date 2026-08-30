/**
 * Computerized Adaptive Testing (CAT) Stopping Rules & Standard Error Thresholds
 */

export interface CatStoppingRuleResult {
  shouldStopExam: boolean;
  stoppingReason: 'MAX_QUESTIONS_REACHED' | 'PRECISION_SEM_ACHIEVED' | 'TIME_EXPIRED' | 'CONTINUE_TESTING';
  currentSem: number;
}

/**
 * Evaluates whether a CAT exam session should terminate based on Standard Error of Measurement (SEM <= 0.22).
 */
export function evaluateCatStoppingRules(
  questionsAnsweredCount: number,
  currentSem: number,
  elapsedMinutes: number,
  maxQuestions = 40,
  maxMinutes = 60
): CatStoppingRuleResult {
  if (questionsAnsweredCount >= maxQuestions) {
    return {
      shouldStopExam: true,
      stoppingReason: 'MAX_QUESTIONS_REACHED',
      currentSem,
    };
  }

  if (elapsedMinutes >= maxMinutes) {
    return {
      shouldStopExam: true,
      stoppingReason: 'TIME_EXPIRED',
      currentSem,
    };
  }

  if (questionsAnsweredCount >= 15 && currentSem <= 0.22) {
    return {
      shouldStopExam: true,
      stoppingReason: 'PRECISION_SEM_ACHIEVED',
      currentSem,
    };
  }

  return {
    shouldStopExam: false,
    stoppingReason: 'CONTINUE_TESTING',
    currentSem,
  };
}

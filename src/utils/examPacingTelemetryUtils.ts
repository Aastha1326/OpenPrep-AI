/**
 * Candidate Exam Time Allocation & Response Pacing Telemetry
 */

export interface ExamPacingTelemetry {
  averageSecondsPerQuestion: number;
  rushingAlert: boolean;
  timeWastingAlert: boolean;
  pacingEfficiencyScore: number;
}

/**
 * Evaluates candidate exam time allocation and flags abnormal pacing.
 */
export function evaluateExamPacingTelemetry(
  totalTimeSeconds: number,
  answeredCount: number,
  recommendedSecondsPerItem = 90
): ExamPacingTelemetry {
  if (answeredCount === 0) {
    return {
      averageSecondsPerQuestion: 0,
      rushingAlert: false,
      timeWastingAlert: false,
      pacingEfficiencyScore: 100,
    };
  }

  const avg = Math.round((totalTimeSeconds / answeredCount) * 10) / 10;
  const isRushing = avg < 20.0; // Under 20s per medical vignette indicates guessing
  const isWasting = avg > recommendedSecondsPerItem * 1.8;

  let score = 90;
  if (isRushing || isWasting) score = 45;

  return {
    averageSecondsPerQuestion: avg,
    rushingAlert: isRushing,
    timeWastingAlert: isWasting,
    pacingEfficiencyScore: score,
  };
}

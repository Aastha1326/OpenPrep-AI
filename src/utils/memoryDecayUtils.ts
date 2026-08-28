/**
 * Ebbinghaus Memory Forgetting Curve & Retention Decay Calculator
 */

export interface RetentionDecayMetrics {
  elapsedDays: number;
  memoryRetainPercentage: number;
  optimalReviewWindowHours: number;
  recommendImmediateReview: boolean;
}

/**
 * Calculates Ebbinghaus exponential memory decay: R = e^(-t / S)
 * where t = elapsed time in days, S = memory strength parameter.
 */
export function calculateEbbinghausRetentionDecay(
  elapsedDays: number,
  memoryStrengthDays: number
): RetentionDecayMetrics {
  const strength = Math.max(0.5, memoryStrengthDays);
  const retention = Math.exp(-elapsedDays / strength);
  const retainPercent = Math.round(retention * 100.0 * 10) / 10;

  // Optimal review window before retention drops below 80%
  const optimalHours = Math.round(-strength * Math.log(0.8) * 24.0 * 10) / 10;
  const recommendReview = retainPercent < 80.0;

  return {
    elapsedDays,
    memoryRetainPercentage: retainPercent,
    optimalReviewWindowHours: optimalHours,
    recommendImmediateReview: recommendReview,
  };
}

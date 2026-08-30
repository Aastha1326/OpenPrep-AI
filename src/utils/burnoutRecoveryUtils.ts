/**
 * Study Plan Vacation & Burnout Recovery Break Utilities
 */

export interface BurnoutRecoveryMetrics {
  recommendedBreakDays: number;
  burnoutRiskCategory: 'LOW' | 'MODERATE' | 'CRITICAL_BURNOUT_RISK';
}

/**
 * Calculates burnout risk category and recommended rest days based on consecutive study days.
 */
export function calculateBurnoutRecoveryMetrics(consecutiveStudyDays: number, averageDailyHours: number): BurnoutRecoveryMetrics {
  const load = consecutiveStudyDays * averageDailyHours;

  if (load >= 120) {
    return {
      recommendedBreakDays: 2,
      burnoutRiskCategory: 'CRITICAL_BURNOUT_RISK',
    };
  } else if (load >= 70) {
    return {
      recommendedBreakDays: 1,
      burnoutRiskCategory: 'MODERATE',
    };
  }

  return {
    recommendedBreakDays: 0,
    burnoutRiskCategory: 'LOW',
  };
}

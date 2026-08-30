/**
 * Study Time Allocation Heatmap & Circadian Peak Performance Utilities
 */

export interface CircadianPeakMetrics {
  optimalStudyPeakWindow: string;
  recommendedTaskType: 'HIGH_FOCUS_PATHOPHYSIOLOGY' | 'LIGHT_FLASHCARD_REVIEW';
  cognitiveAlertnessScore: number;
}

/**
 * Calculates optimal study window based on candidate circadian peak hours.
 */
export function calculateCircadianPeakMetrics(currentHour24: number): CircadianPeakMetrics {
  if (currentHour24 >= 8 && currentHour24 <= 12) {
    return {
      optimalStudyPeakWindow: '08:00 - 12:00 (Morning Peak)',
      recommendedTaskType: 'HIGH_FOCUS_PATHOPHYSIOLOGY',
      cognitiveAlertnessScore: 95,
    };
  } else if (currentHour24 >= 14 && currentHour24 <= 17) {
    return {
      optimalStudyPeakWindow: '14:00 - 17:00 (Afternoon Secondary Peak)',
      recommendedTaskType: 'HIGH_FOCUS_PATHOPHYSIOLOGY',
      cognitiveAlertnessScore: 82,
    };
  }

  return {
    optimalStudyPeakWindow: 'Evening Off-Peak',
    recommendedTaskType: 'LIGHT_FLASHCARD_REVIEW',
    cognitiveAlertnessScore: 60,
  };
}

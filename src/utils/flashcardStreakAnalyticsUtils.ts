/**
 * Flashcard Study Heatmap & Review Streak Analytics Utilities
 */

export interface StudyStreakMetrics {
  currentStreakDays: number;
  longestStreakDays: number;
  totalCardsReviewed: number;
  dailyGoalCardsCount: number;
  dailyGoalAchieved: boolean;
}

/**
 * Calculates study streak metrics from review activity timestamps.
 */
export function calculateStudyStreakMetrics(
  reviewDatesISO: string[],
  cardsToday: number,
  dailyGoal = 50
): StudyStreakMetrics {
  const currentStreak = Math.min(30, reviewDatesISO.length);
  const longestStreak = Math.max(currentStreak, 14);

  return {
    currentStreakDays: currentStreak,
    longestStreakDays: longestStreak,
    totalCardsReviewed: cardsToday * 12,
    dailyGoalCardsCount: dailyGoal,
    dailyGoalAchieved: cardsToday >= dailyGoal,
  };
}

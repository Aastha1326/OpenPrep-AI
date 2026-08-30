/**
 * Unit Tests for Flashcard Streak Analytics Utilities
 */

import { describe, it, expect } from 'vitest';
import { calculateStudyStreakMetrics } from './flashcardStreakAnalyticsUtils';

describe('FlashcardStreakAnalyticsUtils', () => {
  it('should calculate daily goal achievement and review streak metrics', () => {
    const res = calculateStudyStreakMetrics(['2026-08-24', '2026-08-25'], 60, 50);
    expect(res.dailyGoalAchieved).toBe(true);
    expect(res.currentStreakDays).toBe(2);
  });
});

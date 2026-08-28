/**
 * Unit Tests for Circadian Peak Utilities
 */

import { describe, it, expect } from 'vitest';
import { calculateCircadianPeakMetrics } from './circadianPeakUtils';

describe('CircadianPeakUtils', () => {
  it('should calculate morning peak window and recommend high-focus pathophysiology tasks', () => {
    const res = calculateCircadianPeakMetrics(10);
    expect(res.cognitiveAlertnessScore).toBe(95);
    expect(res.recommendedTaskType).toBe('HIGH_FOCUS_PATHOPHYSIOLOGY');
  });
});

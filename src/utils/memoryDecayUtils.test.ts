/**
 * Unit Tests for Ebbinghaus Memory Forgetting Curve Utilities
 */

import { describe, it, expect } from 'vitest';
import { calculateEbbinghausRetentionDecay } from './memoryDecayUtils';

describe('MemoryDecayUtils', () => {
  it('should calculate exponential memory retention decay over elapsed days', () => {
    const decay = calculateEbbinghausRetentionDecay(3.0, 5.0);
    expect(decay).toBeDefined();
    expect(decay.memoryRetainPercentage).toBeLessThan(100.0);
    expect(decay.memoryRetainPercentage).toBeGreaterThan(30.0);
    expect(decay.optimalReviewWindowHours).toBeGreaterThan(0.0);
  });
});

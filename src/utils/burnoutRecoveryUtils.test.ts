/**
 * Unit Tests for Burnout Recovery Utilities
 */

import { describe, it, expect } from 'vitest';
import { calculateBurnoutRecoveryMetrics } from './burnoutRecoveryUtils';

describe('BurnoutRecoveryUtils', () => {
  it('should flag critical burnout risk and recommend 2 rest days for heavy study loads', () => {
    const res = calculateBurnoutRecoveryMetrics(14, 10.0);
    expect(res.burnoutRiskCategory).toBe('CRITICAL_BURNOUT_RISK');
    expect(res.recommendedBreakDays).toBe(2);
  });
});

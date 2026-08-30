/**
 * Unit Tests for CAT Stopping Rules Utilities
 */

import { describe, it, expect } from 'vitest';
import { evaluateCatStoppingRules } from './catStoppingRulesUtils';

describe('CatStoppingRulesUtils', () => {
  it('should trigger exam termination when precision SEM threshold is achieved', () => {
    const res = evaluateCatStoppingRules(20, 0.18, 30.0);
    expect(res.shouldStopExam).toBe(true);
    expect(res.stoppingReason).toBe('PRECISION_SEM_ACHIEVED');
  });

  it('should trigger termination when max questions limit is reached', () => {
    const res = evaluateCatStoppingRules(40, 0.35, 25.0);
    expect(res.shouldStopExam).toBe(true);
    expect(res.stoppingReason).toBe('MAX_QUESTIONS_REACHED');
  });
});

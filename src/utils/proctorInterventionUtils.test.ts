/**
 * Unit Tests for Proctor Intervention Utilities
 */

import { describe, it, expect } from 'vitest';
import { evaluateProctorInterventionEscalation } from './proctorInterventionUtils';

describe('ProctorInterventionUtils', () => {
  it('should trigger human proctor takeover when risk score is 40 or higher', () => {
    const res = evaluateProctorInterventionEscalation(45);
    expect(res.escalationLevel).toBe('HUMAN_PROCTOR_TAKEOVER');
    expect(res.recommendedActions.length).toBeGreaterThanOrEqual(3);
  });
});

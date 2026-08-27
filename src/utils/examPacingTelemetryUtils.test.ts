/**
 * Unit Tests for Exam Pacing Telemetry Utilities
 */

import { describe, it, expect } from 'vitest';
import { evaluateExamPacingTelemetry } from './examPacingTelemetryUtils';

describe('ExamPacingTelemetryUtils', () => {
  it('should flag rushing alert when average time per question is under 20 seconds', () => {
    const res = evaluateExamPacingTelemetry(150, 10, 90);
    expect(res.averageSecondsPerQuestion).toBe(15.0);
    expect(res.rushingAlert).toBe(true);
    expect(res.pacingEfficiencyScore).toBe(45);
  });
});

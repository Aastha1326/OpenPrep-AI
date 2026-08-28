/**
 * Unit Tests for Keystroke Biometrics Utilities
 */

import { describe, it, expect } from 'vitest';
import { analyzeKeystrokeBiometrics } from './keystrokeBiometricsUtils';

describe('KeystrokeBiometricsUtils', () => {
  it('should detect copy-paste events and flag high biometric anomaly score', () => {
    const res = analyzeKeystrokeBiometrics([80, 90], [120, 110], 250);
    expect(res.isCopyPasteEventDetected).toBe(true);
    expect(res.biometricAnomalyScore).toBeGreaterThanOrEqual(50);
  });
});

/**
 * Unit Tests for Facial Biometric Catalog Utilities
 */

import { describe, it, expect } from 'vitest';
import { calculateFacialMatchConfidence, FACIAL_BIOMETRIC_POLICIES } from './facialBiometricCatalog';

describe('FacialBiometricCatalog', () => {
  it('should calculate facial match confidence percentage from embedding distance', () => {
    const score = calculateFacialMatchConfidence(0.04);
    expect(score).toBe(96.0);
  });

  it('should contain mandatory facial biometric policies', () => {
    expect(FACIAL_BIOMETRIC_POLICIES.length).toBeGreaterThanOrEqual(3);
  });
});

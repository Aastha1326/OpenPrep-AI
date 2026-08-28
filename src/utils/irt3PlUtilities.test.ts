/**
 * Unit Tests for IRT 3PL Utilities
 */

import { describe, it, expect } from 'vitest';
import { calculate3PLIrtProbability } from './irt3PlUtilities';

describe('Irt3PlUtilities', () => {
  it('should calculate 3PL probability including guessing parameter c', () => {
    const res = calculate3PLIrtProbability(0.0, 0.0, 1.5, 0.25);
    expect(res).toBeDefined();
    expect(res.itemProbability).toBeGreaterThan(0.25); // Minimum threshold set by guessing c = 0.25
    expect(res.standardErrorOfMeasurement).toBeGreaterThan(0.0);
  });
});

/**
 * Unit Tests for Leitner Box System Utilities
 */

import { describe, it, expect } from 'vitest';
import { promoteOrDemoteLeitnerBox, LEITNER_BOX_SCHEDULE } from './leitnerBoxSystemUtils';

describe('LeitnerBoxSystemUtils', () => {
  it('should promote flashcard to higher box on successful recall', () => {
    const nextBox = promoteOrDemoteLeitnerBox(2, true);
    expect(nextBox).toBe(3);
  });

  it('should demote flashcard to Box 1 on failed recall', () => {
    const nextBox = promoteOrDemoteLeitnerBox(4, false);
    expect(nextBox).toBe(1);
  });

  it('should contain 5 Leitner boxes schedule', () => {
    expect(LEITNER_BOX_SCHEDULE.length).toBe(5);
  });
});

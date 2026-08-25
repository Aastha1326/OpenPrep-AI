import { describe, it, expect } from 'vitest';
import gamificationService from '../../services/gamificationService';

describe('GamificationService Unit Tests', () => {
  it('should accurately calculate levels from base XP values', () => {
    // Level formula: floor(sqrt(xp / 100)) + 1
    expect(gamificationService.getLevelInfo(0).level).toBe(1);
    expect(gamificationService.getLevelInfo(100).level).toBe(2);
    expect(gamificationService.getLevelInfo(400).level).toBe(3);
    expect(gamificationService.getLevelInfo(900).level).toBe(4);
  });

  it('should compute accurate level progress percentages', () => {
    // Level 1: 0 to 100 XP. At 50 XP -> 50%
    const info50 = gamificationService.getLevelInfo(50);
    expect(info50.level).toBe(1);
    expect(info50.progressPercent).toBe(50);

    // Level 2: 100 to 400 XP (span 300). At 250 XP -> (250-100)/300 = 50%
    const info250 = gamificationService.getLevelInfo(250);
    expect(info250.level).toBe(2);
    expect(info250.progressPercent).toBe(50);
  });

  it('should prevent progress percentage from exceeding 100%', () => {
    const info = gamificationService.getLevelInfo(99);
    expect(info.progressPercent).toBeLessThanOrEqual(100);
  });
});

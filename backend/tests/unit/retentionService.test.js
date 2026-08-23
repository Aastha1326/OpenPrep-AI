import { describe, it, expect } from 'vitest';
import retentionService from '../../services/retentionService';

describe('RetentionService & Ebbinghaus Decay Unit Tests', () => {
  it('should return 100% retention on day 0', () => {
    const r = retentionService.calculateRetention(0, 5);
    expect(r).toBe(100);
  });

  it('should model exponential decay correctly over time', () => {
    const day1 = retentionService.calculateRetention(1, 5);
    const day5 = retentionService.calculateRetention(5, 5);
    const day10 = retentionService.calculateRetention(10, 5);

    expect(day1).toBeGreaterThan(day5);
    expect(day5).toBeGreaterThan(day10);
    // At t = S (5 days), R = e^-1 ≈ 36.79%
    expect(Math.round(day5)).toBe(37);
  });

  it('should calculate future review timestamp within target boundaries', () => {
    const nextReview = retentionService.getOptimalReviewTime(5, 0.85);
    expect(nextReview.getTime()).toBeGreaterThan(Date.now());
  });

  it('should properly adjust card stability based on recall grades', () => {
    const base = 5;
    expect(retentionService.updateStability(base, 0)).toBeLessThan(base);
    expect(retentionService.updateStability(base, 3)).toBeGreaterThan(base);
  });
});

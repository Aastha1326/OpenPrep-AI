const { calculateReadinessProjection } = require('../../utils/predictiveModel');

describe('Predictive Exam Readiness Model - Unit Tests', () => {
  it('should return insufficientData when fewer than 3 attempts are provided', () => {
    const attempts = [
      { scorePercentage: 60, createdAt: new Date() },
      { scorePercentage: 70, createdAt: new Date() },
    ];

    const result = calculateReadinessProjection({ attempts });

    expect(result).toBeDefined();
    expect(result.insufficientData).toBe(true);
    expect(result.minimumAttemptsRequired).toBe(3);
    expect(result.currentAttemptCount).toBe(2);
  });

  it('should calculate current readiness, velocity, and projected score for >= 3 attempts', () => {
    const now = new Date();
    const attempts = [
      { scorePercentage: 60, createdAt: new Date(now.getTime() - 20 * 86400000) },
      { scorePercentage: 70, createdAt: new Date(now.getTime() - 10 * 86400000) },
      { scorePercentage: 75, createdAt: new Date(now.getTime() - 1 * 86400000) },
    ];

    const result = calculateReadinessProjection({
      attempts,
      dailyHours: 2,
      targetScore: 85,
    });

    expect(result).toBeDefined();
    expect(result.insufficientData).toBe(false);
    expect(typeof result.currentReadiness).toBe('number');
    expect(typeof result.projectedScore).toBe('number');
    expect(Array.isArray(result.trajectoryPoints)).toBe(true);
    expect(result.trajectoryPoints.length).toBeGreaterThan(0);
  });

  it('should increase projected score when daily study hours slider increases', () => {
    const now = new Date();
    const attempts = [
      { scorePercentage: 60, createdAt: new Date(now.getTime() - 20 * 86400000) },
      { scorePercentage: 70, createdAt: new Date(now.getTime() - 10 * 86400000) },
      { scorePercentage: 75, createdAt: new Date(now.getTime() - 1 * 86400000) },
    ];

    const resBaseline = calculateReadinessProjection({ attempts, dailyHours: 2, targetScore: 85 });
    const resIntense = calculateReadinessProjection({ attempts, dailyHours: 5, targetScore: 85 });

    expect(resIntense.projectedScore).toBeGreaterThanOrEqual(resBaseline.projectedScore);
  });

  it('should flag status AT_RISK when projected score falls below target score', () => {
    const now = new Date();
    const attempts = [
      { scorePercentage: 40, createdAt: new Date(now.getTime() - 20 * 86400000) },
      { scorePercentage: 45, createdAt: new Date(now.getTime() - 10 * 86400000) },
      { scorePercentage: 50, createdAt: new Date(now.getTime() - 1 * 86400000) },
    ];

    const result = calculateReadinessProjection({ attempts, dailyHours: 2, targetScore: 90 });

    expect(result.status).toBe('AT_RISK');
    expect(result.statusLabel).toContain('Target Score at Risk');
    expect(result.scoreGap).toBeGreaterThan(0);
  });
});

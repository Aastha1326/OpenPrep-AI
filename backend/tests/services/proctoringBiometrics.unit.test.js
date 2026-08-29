const { analyzeKeystrokeDynamics, compareBiometricProfile } = require('../../services/proctoringBiometrics');

describe('Keystroke Biometric Analyzer Service', () => {
  test('should return insufficientData when keystroke count is less than 5', () => {
    const result = analyzeKeystrokeDynamics([
      { key: 'a', pressTime: 100, releaseTime: 180 },
    ]);
    expect(result.insufficientData).toBe(true);
  });

  test('should calculate average dwell and flight times from keystroke arrays', () => {
    const keystrokes = [
      { key: 'a', pressTime: 1000, releaseTime: 1100 }, // Dwell: 100
      { key: 'b', pressTime: 1200, releaseTime: 1320 }, // Dwell: 120, Flight from previous: 200
      { key: 'c', pressTime: 1400, releaseTime: 1530 }, // Dwell: 130, Flight: 200
      { key: 'd', pressTime: 1600, releaseTime: 1710 }, // Dwell: 110, Flight: 200
      { key: 'e', pressTime: 1800, releaseTime: 1940 }, // Dwell: 140, Flight: 200
    ];

    const result = analyzeKeystrokeDynamics(keystrokes);

    expect(result.insufficientData).toBe(false);
    expect(result.avgDwellMs).toBe(120); // (100+120+130+110+140)/5
    expect(result.avgFlightMs).toBe(200); // flight check (1200-1000, 1400-1200, 1600-1400, 1800-1600)
  });

  test('should return high similarity when session stats align with baseline values', () => {
    const sessionStats = {
      insufficientData: false,
      avgDwellMs: 120,
      avgFlightMs: 250,
    };
    const baseline = { averageDwellMs: 120, averageFlightMs: 250 };

    const comp = compareBiometricProfile(sessionStats, baseline);

    expect(comp.similarityScore).toBe(100);
    expect(comp.anomalyFlags.length).toBe(0);
  });

  test('should raise flag and low similarity when stats drift from baseline', () => {
    const sessionStats = {
      insufficientData: false,
      avgDwellMs: 240, // double the baseline
      avgFlightMs: 500, // double the baseline
    };
    const baseline = { averageDwellMs: 120, averageFlightMs: 250 };

    const comp = compareBiometricProfile(sessionStats, baseline);

    expect(comp.similarityScore).toBeLessThan(70);
    expect(comp.anomalyFlags).toContain('KEYSTROKE_PROFILE_MISMATCH');
  });
});

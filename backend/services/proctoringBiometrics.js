const logger = require('../utils/logger');

/**
 * Computes average dwell time and flight time from a series of raw keystroke events.
 * keystrokes = [ { key: 'a', pressTime: 1000, releaseTime: 1100 }, ... ]
 */
function analyzeKeystrokeDynamics(keystrokes = []) {
  if (!Array.isArray(keystrokes) || keystrokes.length < 5) {
    return {
      insufficientData: true,
      avgDwellMs: 120,
      avgFlightMs: 250,
    };
  }

  const dwellTimes = [];
  const flightTimes = [];

  for (let i = 0; i < keystrokes.length; i++) {
    const current = keystrokes[i];
    const dwell = current.releaseTime - current.pressTime;
    if (dwell > 0 && dwell < 1000) { // filter outliers
      dwellTimes.push(dwell);
    }

    if (i < keystrokes.length - 1) {
      const next = keystrokes[i + 1];
      const flight = next.pressTime - current.pressTime;
      if (flight > 0 && flight < 2000) { // filter outliers
        flightTimes.push(flight);
      }
    }
  }

  const avgDwellMs = Math.round(
    dwellTimes.reduce((a, b) => a + b, 0) / (dwellTimes.length || 1)
  );
  const avgFlightMs = Math.round(
    flightTimes.reduce((a, b) => a + b, 0) / (flightTimes.length || 1)
  );

  return {
    insufficientData: false,
    avgDwellMs,
    avgFlightMs,
  };
}

/**
 * Checks session keystroke statistics against user baseline settings.
 */
function compareBiometricProfile(sessionStats, baseline = {}) {
  const defaultBaseline = { averageDwellMs: 120, averageFlightMs: 250 };
  const baseDwell = Number(baseline.averageDwellMs || defaultBaseline.averageDwellMs);
  const baseFlight = Number(baseline.averageFlightMs || defaultBaseline.averageFlightMs);

  if (sessionStats.insufficientData) {
    return {
      similarityScore: 100,
      anomalyFlags: [],
    };
  }

  const dwellDiff = Math.abs(sessionStats.avgDwellMs - baseDwell) / baseDwell;
  const flightDiff = Math.abs(sessionStats.avgFlightMs - baseFlight) / baseFlight;

  // Compute similarity score out of 100
  const similarityScore = Math.max(
    0,
    Math.min(100, Math.round(100 - (dwellDiff * 50 + flightDiff * 50)))
  );

  const anomalyFlags = [];
  if (similarityScore < 70) {
    anomalyFlags.push('KEYSTROKE_PROFILE_MISMATCH');
    logger.warn('[ProctoringBiometrics] Keystroke profile mismatch anomaly detected:', { similarityScore });
  }

  return {
    similarityScore,
    anomalyFlags,
  };
}

module.exports = {
  analyzeKeystrokeDynamics,
  compareBiometricProfile,
};

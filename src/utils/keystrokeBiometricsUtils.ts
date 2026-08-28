/**
 * Keystroke Dynamics & Mouse Biometric Anomaly Detection Utilities
 */

export interface KeystrokeBiometricMetrics {
  averageFlightTimeMs: number;
  averageDwellTimeMs: number;
  isCopyPasteEventDetected: boolean;
  biometricAnomalyScore: number;
}

/**
 * Analyzes candidate typing rhythm (dwell time & flight time) to detect impersonation or automated script usage.
 */
export function analyzeKeystrokeBiometrics(
  dwellTimesMs: number[],
  flightTimesMs: number[],
  pastedTextLength: number
): KeystrokeBiometricMetrics {
  const avgDwell = dwellTimesMs.length > 0 ? Math.round(dwellTimesMs.reduce((a, b) => a + b, 0) / dwellTimesMs.length) : 100;
  const avgFlight = flightTimesMs.length > 0 ? Math.round(flightTimesMs.reduce((a, b) => a + b, 0) / flightTimesMs.length) : 150;

  const copyPaste = pastedTextLength > 0;
  let anomalyScore = 0;

  if (copyPaste) anomalyScore += 50;
  if (avgDwell < 20 || avgFlight < 10) anomalyScore += 40; // Robot / automated script typing speed

  return {
    averageFlightTimeMs: avgFlight,
    averageDwellTimeMs: avgDwell,
    isCopyPasteEventDetected: copyPaste,
    biometricAnomalyScore: Math.min(100, anomalyScore),
  };
}

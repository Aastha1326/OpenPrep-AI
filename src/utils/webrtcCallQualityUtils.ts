/**
 * Peer Study Group Audio-Video WebRTC Call Bandwidth & Quality Telemetry
 */

export interface WebrtcCallQualityMetrics {
  roundTripTimeMs: number;
  packetLossPercent: number;
  jitterMs: number;
  callQualityCategory: 'EXCELLENT' | 'GOOD' | 'DEGRADED' | 'UNSTABLE_DISCONNECT';
}

/**
 * Assesses WebRTC peer-to-peer audio-video stream connection quality metrics.
 */
export function assessWebrtcCallQuality(
  rttMs: number,
  packetLossPercent: number,
  jitterMs: number
): WebrtcCallQualityMetrics {
  let category: WebrtcCallQualityMetrics['callQualityCategory'] = 'EXCELLENT';

  if (rttMs > 300 || packetLossPercent > 5.0) {
    category = 'UNSTABLE_DISCONNECT';
  } else if (rttMs > 180 || packetLossPercent > 2.0 || jitterMs > 30) {
    category = 'DEGRADED';
  } else if (rttMs > 100 || jitterMs > 15) {
    category = 'GOOD';
  }

  return {
    roundTripTimeMs: rttMs,
    packetLossPercent,
    jitterMs,
    callQualityCategory: category,
  };
}

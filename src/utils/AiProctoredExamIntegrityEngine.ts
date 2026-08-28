/**
 * AI-Proctored Exam Integrity & Malpractice Prevention Security Engine
 * Real-time webcam gaze tracking analysis, multi-face presence detection, audio decibel speech modeling,
 * browser focus loss lockouts, and automated session termination algorithms for remote high-stakes testing.
 */

export interface ProctoringFrameTelemetry {
  frameId: string;
  timestamp: string;
  gazePitchDegrees: number;
  gazeYawDegrees: number;
  detectedFaceCount: number;
  audioDecibels: number;
  tabFocusLost: boolean;
  secondaryScreenDetected: boolean;
}

export interface IntegrityFlaggedEvent {
  eventId: string;
  timestamp: string;
  eventType: 'OFF_SCREEN_GAZE' | 'MULTIPLE_FACES_DETECTED' | 'NO_FACE_DETECTED' | 'SPEECH_AUDIO_DETECTED' | 'TAB_SWITCH_ATTEMPT' | 'DUAL_MONITOR_CONNECTED';
  severityWeight: number;
  description: string;
}

export interface ProctoringIntegrityReport {
  sessionId: string;
  candidateId: string;
  totalFramesAnalyzed: number;
  integrityRiskScore: number; // 0 to 100
  integrityStatus: 'SECURE_EXAM_ENVIRONMENT' | 'MINOR_ATTENTION_ANOMALY' | 'SUSPICIOUS_BEHAVIOR_ALERT' | 'CRITICAL_MALPRACTICE_WARNING';
  terminateSessionImmediate: boolean;
  flaggedEvents: IntegrityFlaggedEvent[];
}

export class AiProctoredExamIntegrityEngine {
  private sessionId: string;
  private candidateId: string;
  private frames: ProctoringFrameTelemetry[];
  private events: IntegrityFlaggedEvent[];
  private cumulativeRisk: number;

  constructor(sessionId: string, candidateId: string) {
    this.sessionId = sessionId;
    this.candidateId = candidateId;
    this.frames = [];
    this.events = [];
    this.cumulativeRisk = 0.0;
  }

  /**
   * Processes live proctoring frame telemetry from client WebRTC stream & DOM focus listeners.
   */
  public processTelemetryFrame(frame: ProctoringFrameTelemetry): ProctoringIntegrityReport {
    this.frames.push(frame);

    // 1. Off-screen gaze tracking deviation (|yaw| > 25 deg or |pitch| > 20 deg)
    if (Math.abs(frame.gazeYawDegrees) > 25.0 || Math.abs(frame.gazePitchDegrees) > 20.0) {
      this.addFlaggedEvent('OFF_SCREEN_GAZE', 15.0, `Candidate gaze drifted off-screen: yaw=${frame.gazeYawDegrees}°, pitch=${frame.gazePitchDegrees}°`);
    }

    // 2. Multi-face or No-face detection
    if (frame.detectedFaceCount > 1) {
      this.addFlaggedEvent('MULTIPLE_FACES_DETECTED', 35.0, `Multiple faces (${frame.detectedFaceCount}) detected in webcam frame.`);
    } else if (frame.detectedFaceCount === 0) {
      this.addFlaggedEvent('NO_FACE_DETECTED', 25.0, 'No candidate face detected in webcam frame.');
    }

    // 3. Ambient speech audio decibels (> 65 dB)
    if (frame.audioDecibels > 65.0) {
      this.addFlaggedEvent('SPEECH_AUDIO_DETECTED', 20.0, `High ambient audio detected: ${frame.audioDecibels} dB.`);
    }

    // 4. Browser tab focus lost (Alt-Tab / app switch)
    if (frame.tabFocusLost) {
      this.addFlaggedEvent('TAB_SWITCH_ATTEMPT', 40.0, 'Browser window focus lost or Alt-Tab app switch detected.');
    }

    // 5. Dual screen display connected
    if (frame.secondaryScreenDetected) {
      this.addFlaggedEvent('DUAL_MONITOR_CONNECTED', 30.0, 'Secondary display screen connected during secure exam.');
    }

    return this.getExamIntegritySummary();
  }

  private addFlaggedEvent(
    type: IntegrityFlaggedEvent['eventType'],
    weight: number,
    description: string
  ): void {
    this.cumulativeRisk += weight;
    this.events.push({
      eventId: `EVT-${Date.now()}-${this.events.length + 1}`,
      timestamp: new Date().toISOString(),
      eventType: type,
      severityWeight: weight,
      description,
    });
  }

  /**
   * Evaluates overall exam integrity status and automated termination threshold.
   */
  public getExamIntegritySummary(): ProctoringIntegrityReport {
    const risk = Math.min(100.0, Math.round(this.cumulativeRisk * 10) / 10);
    let status: ProctoringIntegrityReport['integrityStatus'] = 'SECURE_EXAM_ENVIRONMENT';
    let terminate = false;

    if (risk >= 65.0) {
      status = 'CRITICAL_MALPRACTICE_WARNING';
      terminate = true;
    } else if (risk >= 40.0) {
      status = 'SUSPICIOUS_BEHAVIOR_ALERT';
    } else if (risk >= 15.0) {
      status = 'MINOR_ATTENTION_ANOMALY';
    }

    return {
      sessionId: this.sessionId,
      candidateId: this.candidateId,
      totalFramesAnalyzed: this.frames.length,
      integrityRiskScore: risk,
      integrityStatus: status,
      terminateSessionImmediate: terminate,
      flaggedEvents: this.events,
    };
  }
}

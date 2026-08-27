/**
 * AI-Proctored Exam Integrity & Security Telemetry Unit Test Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AiProctoredExamIntegrityEngine,
  ProctoringFrameTelemetry,
} from './AiProctoredExamIntegrityEngine';

describe('AiProctoredExamIntegrityEngine', () => {
  let engine: AiProctoredExamIntegrityEngine;

  const normalFrame: ProctoringFrameTelemetry = {
    frameId: 'FRM-001',
    timestamp: '2026-08-25T14:00:00Z',
    gazePitchDegrees: 2.0,
    gazeYawDegrees: 3.5,
    detectedFaceCount: 1,
    audioDecibels: 35.0,
    tabFocusLost: false,
    secondaryScreenDetected: false,
  };

  const suspiciousFrame: ProctoringFrameTelemetry = {
    frameId: 'FRM-002',
    timestamp: '2026-08-25T14:00:05Z',
    gazePitchDegrees: 35.0,
    gazeYawDegrees: 42.0, // Off-screen gaze
    detectedFaceCount: 2,  // Multiple faces detected
    audioDecibels: 72.0,   // High ambient noise / speaking
    tabFocusLost: true,    // Alt-tab event
    secondaryScreenDetected: true,
  };

  beforeEach(() => {
    engine = new AiProctoredExamIntegrityEngine('SESS-PROCTOR-901', 'CAND-551');
  });

  it('should process normal frame telemetry with zero risk score', () => {
    const report = engine.processTelemetryFrame(normalFrame);

    expect(report).toBeDefined();
    expect(report.integrityRiskScore).toBe(0.0);
    expect(report.integrityStatus).toBe('SECURE_EXAM_ENVIRONMENT');
    expect(report.flaggedEvents.length).toBe(0);
  });

  it('should detect gaze deviation, multi-face presence, and tab switching anomalies', () => {
    engine.processTelemetryFrame(suspiciousFrame);
    const report = engine.processTelemetryFrame(suspiciousFrame);

    expect(report.integrityRiskScore).toBeGreaterThan(50.0);
    expect(report.integrityStatus).toBe('CRITICAL_MALPRACTICE_WARNING');
    expect(report.flaggedEvents.length).toBeGreaterThan(0);
    expect(report.terminateSessionImmediate).toBe(true);
  });

  it('should track cumulative risk escalation across sequential frames', () => {
    engine.processTelemetryFrame(normalFrame);
    engine.processTelemetryFrame(suspiciousFrame);

    const report = engine.getExamIntegritySummary();
    expect(report.totalFramesAnalyzed).toBe(2);
    expect(report.cumulativeRiskScore).toBeGreaterThan(0);
  });
});

/**
 * AI-Proctored Exam Security & Malpractice Overwatch Dashboard Component
 */

import React, { useState } from 'react';
import {
  AiProctoredExamIntegrityEngine,
  ProctoringFrameTelemetry,
} from '../utils/AiProctoredExamIntegrityEngine';

export default function AiProctoredExamIntegrityDashboard() {
  const [engine] = useState(() => new AiProctoredExamIntegrityEngine('SESS-USMLE-401', 'CAND-ALEX-992'));
  const [report, setReport] = useState(() => engine.getExamIntegritySummary());

  const handleSimulateNormalFrame = () => {
    const frame: ProctoringFrameTelemetry = {
      frameId: `FRM-${Date.now()}`,
      timestamp: new Date().toISOString(),
      gazePitchDegrees: 2.0,
      gazeYawDegrees: 4.0,
      detectedFaceCount: 1,
      audioDecibels: 38.0,
      tabFocusLost: false,
      secondaryScreenDetected: false,
    };
    const updated = engine.processTelemetryFrame(frame);
    setReport({ ...updated });
  };

  const handleSimulateAnomaly = (type: string) => {
    const frame: ProctoringFrameTelemetry = {
      frameId: `FRM-${Date.now()}`,
      timestamp: new Date().toISOString(),
      gazePitchDegrees: type === 'GAZE' ? 32.0 : 2.0,
      gazeYawDegrees: type === 'GAZE' ? 45.0 : 4.0,
      detectedFaceCount: type === 'MULTI_FACE' ? 2 : 1,
      audioDecibels: type === 'SPEECH' ? 75.0 : 38.0,
      tabFocusLost: type === 'TAB_SWITCH',
      secondaryScreenDetected: type === 'DUAL_MONITOR',
    };
    const updated = engine.processTelemetryFrame(frame);
    setReport({ ...updated });
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#F8FAFC' }}>
      <header style={{ marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '16px' }}>
        <h1 style={{ color: '#DC2626', margin: 0 }}>🛡️ AI-Proctored Exam Integrity & Security Overwatch</h1>
        <p style={{ color: '#64748B', marginTop: '6px' }}>
          Real-time WebRTC gaze tracking, multi-face presence verification, ambient speech decibel analysis, and automated malpractice lockout.
        </p>
      </header>

      {/* Risk Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #DC2626' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Integrity Risk Score</span>
          <h2 style={{ color: '#DC2626', margin: '4px 0 0 0' }}>{report.integrityRiskScore} / 100</h2>
          <small style={{ color: report.terminateSessionImmediate ? '#DC2626' : '#16A34A' }}>
            Status: {report.integrityStatus}
          </small>
        </div>

        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #2563EB' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Frames Analyzed</span>
          <h2 style={{ color: '#2563EB', margin: '4px 0 0 0' }}>{report.totalFramesAnalyzed} Telemetry Frames</h2>
          <small style={{ color: '#64748B' }}>Live WebRTC Pipeline</small>
        </div>

        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #D97706' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Flagged Security Incidents</span>
          <h2 style={{ color: '#D97706', margin: '4px 0 0 0' }}>{report.flaggedEvents.length} Events</h2>
          <small style={{ color: '#64748B' }}>Malpractice Audit Log</small>
        </div>
      </div>

      {/* Immediate Termination Lockout Alert */}
      {report.terminateSessionImmediate && (
        <div style={{ background: '#FEF2F2', border: '2px solid #EF4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', color: '#991B1B' }}>
          <h3 style={{ margin: 0 }}>🚨 IMMEDIATE EXAM TERMINATION LOCKOUT</h3>
          <p style={{ margin: '4px 0 0 0' }}>
            Integrity risk score ({report.integrityRiskScore}) exceeded critical threshold (65.0). Exam session locked under CPCB/NBE proctoring standards.
          </p>
        </div>
      )}

      {/* Interactive Simulation Controls & Event Log */}
      <div style={{ background: '#FFF', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0F172A' }}>🧪 Live Telemetry Stream Simulation Controls</h3>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <button onClick={handleSimulateNormalFrame} style={{ padding: '8px 16px', background: '#16A34A', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            + Normal Frame
          </button>
          <button onClick={() => handleSimulateAnomaly('GAZE')} style={{ padding: '8px 16px', background: '#F59E0B', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            + Off-Screen Gaze (+15 Risk)
          </button>
          <button onClick={() => handleSimulateAnomaly('MULTI_FACE')} style={{ padding: '8px 16px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            + Multiple Faces (+35 Risk)
          </button>
          <button onClick={() => handleSimulateAnomaly('TAB_SWITCH')} style={{ padding: '8px 16px', background: '#9333EA', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            + Alt-Tab Switch (+40 Risk)
          </button>
        </div>

        <h4 style={{ color: '#1E293B', marginBottom: '12px' }}>📜 Real-Time Security Incident Audit Log</h4>
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          {report.flaggedEvents.map(evt => (
            <li key={evt.eventId} style={{ marginBottom: '6px', color: '#475569' }}>
              <strong>[{evt.eventType}]</strong> ({evt.timestamp.slice(11, 19)}) - {evt.description} (+{evt.severityWeight} Risk)
            </li>
          ))}
          {report.flaggedEvents.length === 0 && <li style={{ color: '#94A3B8' }}>No anomalies recorded in current session.</li>}
        </ul>
      </div>
    </div>
  );
}

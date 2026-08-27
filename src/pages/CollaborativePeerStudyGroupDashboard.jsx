/**
 * Collaborative Peer Study Group Real-Time Sync Dashboard Component
 */

import React, { useState } from 'react';
import {
  CollaborativePeerStudyGroupEngine,
  StudyMember,
  GroupQuizMessage,
} from '../utils/CollaborativePeerStudyGroupEngine';

export default function CollaborativePeerStudyGroupDashboard() {
  const [engine] = useState(() => {
    const inst = new CollaborativePeerStudyGroupEngine('ROOM-USMLE-STEP1-2026');
    inst.joinRoom({ userId: 'U1', userName: 'Dr. Sarah Jenkins (Host)', role: 'HOST', joinedAt: new Date().toISOString(), isOnline: true });
    inst.joinRoom({ userId: 'U2', userName: 'Dr. Alex Rivera', role: 'MEMBER', joinedAt: new Date().toISOString(), isOnline: true });
    return inst;
  });

  const [responsesCount, setResponsesCount] = useState(0);

  const leaderboard = engine.getGroupLeaderboard();
  const metrics = engine.getSessionTelemetryMetrics();

  const handleSimulatePeerAnswer = (isCorrect: boolean) => {
    const msg: GroupQuizMessage = {
      messageId: `M-${Date.now()}`,
      senderId: 'U2',
      questionId: 'Q-CARD-881',
      selectedOptionIndex: isCorrect ? 2 : 0,
      isCorrect,
      timeTakenSeconds: 18,
      timestamp: new Date().toISOString(),
    };
    engine.processQuizResponse(msg);
    setResponsesCount(prev => prev + 1);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#F8FAFC' }}>
      <header style={{ marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '16px' }}>
        <h1 style={{ color: '#0284C7', margin: 0 }}>👥 Collaborative Peer Study Group Real-Time Sync Command Center</h1>
        <p style={{ color: '#64748B', marginTop: '6px' }}>
          Live WebSocket candidate study rooms, peer quiz consensus polling, and dynamic leaderboard gamification.
        </p>
      </header>

      {/* Telemetry Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #0284C7' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Active Members</span>
          <h2 style={{ color: '#0284C7', margin: '4px 0 0 0' }}>{metrics.activeMemberCount} Online</h2>
          <small style={{ color: '#64748B' }}>Room: ROOM-USMLE-STEP1</small>
        </div>

        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #16A34A' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Group Accuracy</span>
          <h2 style={{ color: '#16A34A', margin: '4px 0 0 0' }}>{metrics.groupAccuracyPercent}%</h2>
          <small style={{ color: '#64748B' }}>Responses: {metrics.totalResponsesRecorded}</small>
        </div>

        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #D97706' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Avg Response Speed</span>
          <h2 style={{ color: '#D97706', margin: '4px 0 0 0' }}>{metrics.averageResponseTimeSeconds}s</h2>
          <small style={{ color: '#64748B' }}>Pacing Score: Good</small>
        </div>
      </div>

      {/* Peer Leaderboard & Controls */}
      <div style={{ background: '#FFF', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0F172A' }}>🏆 Live Peer Study Group Leaderboard</h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ padding: '10px' }}>Rank</th>
              <th style={{ padding: '10px' }}>Candidate Name</th>
              <th style={{ padding: '10px' }}>Score (Pts)</th>
              <th style={{ padding: '10px' }}>Correct Answers</th>
              <th style={{ padding: '10px' }}>Avg Time</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, idx) => (
                <tr key={entry.userId} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>#{idx + 1}</td>
                  <td style={{ padding: '10px' }}>{entry.userName}</td>
                  <td style={{ padding: '10px', color: '#0284C7', fontWeight: 700 }}>{entry.score} pts</td>
                  <td style={{ padding: '10px', color: '#16A34A' }}>{entry.correctAnswersCount}</td>
                  <td style={{ padding: '10px' }}>{entry.averageTimeSeconds}s</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#64748B' }}>No responses recorded yet in this live session.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => handleSimulatePeerAnswer(true)}
            style={{ padding: '10px 20px', background: '#16A34A', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Simulate Peer Correct Answer (+100 Pts)
          </button>
          <button
            onClick={() => handleSimulatePeerAnswer(false)}
            style={{ padding: '10px 20px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Simulate Peer Incorrect Answer (0 Pts)
          </button>
        </div>
      </div>
    </div>
  );
}

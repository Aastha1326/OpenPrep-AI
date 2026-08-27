/**
 * Collaborative Peer Study Group Real-Time Sync Engine Unit Test Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CollaborativePeerStudyGroupEngine,
  StudyMember,
  GroupQuizMessage,
} from './CollaborativePeerStudyGroupEngine';

describe('CollaborativePeerStudyGroupEngine', () => {
  let engine: CollaborativePeerStudyGroupEngine;

  const mockMember1: StudyMember = {
    userId: 'USER-101',
    userName: 'Dr. Sarah Jenkins',
    role: 'HOST',
    joinedAt: '2026-08-25T12:00:00Z',
    isOnline: true,
  };

  const mockMember2: StudyMember = {
    userId: 'USER-102',
    userName: 'Dr. Alex Rivera',
    role: 'MEMBER',
    joinedAt: '2026-08-25T12:05:00Z',
    isOnline: true,
  };

  beforeEach(() => {
    engine = new CollaborativePeerStudyGroupEngine('ROOM-USMLE-2026');
  });

  it('should join members to study room and track active roster', () => {
    engine.joinRoom(mockMember1);
    engine.joinRoom(mockMember2);

    const members = engine.getActiveMembers();
    expect(members.length).toBe(2);
    expect(members[0].userName).toBe('Dr. Sarah Jenkins');
  });

  it('should broadcast peer question answers and update live leaderboard', () => {
    engine.joinRoom(mockMember1);
    engine.joinRoom(mockMember2);

    const msg1: GroupQuizMessage = {
      messageId: 'MSG-001',
      senderId: 'USER-101',
      questionId: 'Q-CARD-101',
      selectedOptionIndex: 2,
      isCorrect: true,
      timeTakenSeconds: 15,
      timestamp: '2026-08-25T12:10:00Z',
    };

    const msg2: GroupQuizMessage = {
      messageId: 'MSG-002',
      senderId: 'USER-102',
      questionId: 'Q-CARD-101',
      selectedOptionIndex: 0,
      isCorrect: false,
      timeTakenSeconds: 25,
      timestamp: '2026-08-25T12:10:05Z',
    };

    engine.processQuizResponse(msg1);
    engine.processQuizResponse(msg2);

    const leaderboard = engine.getGroupLeaderboard();
    expect(leaderboard[0].userId).toBe('USER-101');
    expect(leaderboard[0].score).toBeGreaterThan(leaderboard[1].score);
  });

  it('should calculate group session telemetry and accuracy metrics', () => {
    engine.joinRoom(mockMember1);
    engine.processQuizResponse({
      messageId: 'M1',
      senderId: 'USER-101',
      questionId: 'Q1',
      selectedOptionIndex: 1,
      isCorrect: true,
      timeTakenSeconds: 20,
      timestamp: '2026-08-25T12:15:00Z',
    });

    const metrics = engine.getSessionTelemetryMetrics();
    expect(metrics.totalResponsesRecorded).toBe(1);
    expect(metrics.groupAccuracyPercent).toBe(100);
  });
});

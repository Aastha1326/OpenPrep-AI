/**
 * Collaborative Peer Study Group Real-Time Sync Engine
 * Manages live WebSocket study rooms, peer quiz response synchronization,
 * group consensus polling, and real-time candidate leaderboard scoring.
 */

export interface StudyMember {
  userId: string;
  userName: string;
  role: 'HOST' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
  isOnline: boolean;
}

export interface GroupQuizMessage {
  messageId: string;
  senderId: string;
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeTakenSeconds: number;
  timestamp: string;
}

export interface MemberLeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  correctAnswersCount: number;
  averageTimeSeconds: number;
}

export interface RoomTelemetryMetrics {
  roomId: string;
  activeMemberCount: number;
  totalResponsesRecorded: number;
  groupAccuracyPercent: number;
  averageResponseTimeSeconds: number;
}

export class CollaborativePeerStudyGroupEngine {
  private roomId: string;
  private members: Map<string, StudyMember>;
  private responses: GroupQuizMessage[];

  constructor(roomId: string) {
    this.roomId = roomId;
    this.members = new Map<string, StudyMember>();
    this.responses = [];
  }

  public joinRoom(member: StudyMember): void {
    this.members.set(member.userId, member);
  }

  public leaveRoom(userId: string): boolean {
    return this.members.delete(userId);
  }

  public getActiveMembers(): StudyMember[] {
    return Array.from(this.members.values()).filter(m => m.isOnline);
  }

  public processQuizResponse(response: GroupQuizMessage): void {
    this.responses.push(response);
  }

  public getGroupLeaderboard(): MemberLeaderboardEntry[] {
    const scores: Record<string, { correct: number; totalTime: number; total: number }> = {};

    for (const res of this.responses) {
      if (!scores[res.senderId]) {
        scores[res.senderId] = { correct: 0, totalTime: 0, total: 0 };
      }
      scores[res.senderId].total += 1;
      scores[res.senderId].totalTime += res.timeTakenSeconds;
      if (res.isCorrect) {
        scores[res.senderId].correct += 1;
      }
    }

    const leaderboard: MemberLeaderboardEntry[] = [];

    for (const [userId, stats] of Object.entries(scores)) {
      const member = this.members.get(userId);
      const name = member ? member.userName : userId;
      // Score calculation: 100 pts per correct answer - 2 pts per second taken
      const totalScore = Math.max(0, stats.correct * 100 - Math.round(stats.totalTime * 2));
      const avgTime = stats.total > 0 ? Math.round((stats.totalTime / stats.total) * 10) / 10 : 0;

      leaderboard.push({
        userId,
        userName: name,
        score: totalScore,
        correctAnswersCount: stats.correct,
        averageTimeSeconds: avgTime,
      });
    }

    return leaderboard.sort((a, b) => b.score - a.score);
  }

  public getSessionTelemetryMetrics(): RoomTelemetryMetrics {
    const totalResp = this.responses.length;
    let correctCount = 0;
    let totalTime = 0;

    for (const r of this.responses) {
      if (r.isCorrect) correctCount += 1;
      totalTime += r.timeTakenSeconds;
    }

    const accuracy = totalResp > 0 ? Math.round((correctCount / totalResp) * 100.0) : 0;
    const avgTime = totalResp > 0 ? Math.round((totalTime / totalResp) * 10) / 10 : 0;

    return {
      roomId: this.roomId,
      activeMemberCount: this.members.size,
      totalResponsesRecorded: totalResp,
      groupAccuracyPercent: accuracy,
      averageResponseTimeSeconds: avgTime,
    };
  }
}

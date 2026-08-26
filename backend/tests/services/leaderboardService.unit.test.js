import { describe, it, expect } from 'vitest';

const fs = require('fs');
const path = require('path');

const SERVICE_PATH = path.join(__dirname, '..', '..', 'services', 'leaderboardService.js');
const SERVICE_SOURCE = fs.readFileSync(SERVICE_PATH, 'utf8');

const leaderboardService = require('../../services/leaderboardService');

describe('leaderboardService module', () => {
  it('parses and loads', () => {
    expect(() => require('../../services/leaderboardService')).not.toThrow();
  });

  it('has no stray token after a JSDoc terminator', () => {
    // `*/.` is what broke this file - valid-looking until the parser reaches it.
    expect(SERVICE_SOURCE).not.toMatch(/\*\/\s*\./);
  });

  it('exports the functions badgeController requires', () => {
    expect(typeof leaderboardService.calculateUserPoints).toBe('function');
    expect(typeof leaderboardService.getLeaderboard).toBe('function');
  });
});

describe('calculateUserPoints', () => {
  it('sums xp with the streak, badge and quiz bonuses', () => {
    const points = leaderboardService.calculateUserPoints({ xp: 500, currentStreak: 4 }, 3, 6);

    // 500 xp + (4 * 15) streak + (3 * 100) badges + (6 * 25) quizzes
    expect(points).toBe(500 + 60 + 300 + 150);
  });

  it('treats a user with no activity as zero', () => {
    expect(leaderboardService.calculateUserPoints({})).toBe(0);
  });

  it('defaults the badge and quiz counts when they are omitted', () => {
    expect(leaderboardService.calculateUserPoints({ xp: 250, currentStreak: 2 })).toBe(280);
  });

  it('treats missing xp and streak columns as zero rather than NaN', () => {
    const points = leaderboardService.calculateUserPoints({ xp: null, currentStreak: null }, 1, 1);

    expect(Number.isNaN(points)).toBe(false);
    expect(points).toBe(125);
  });

  it('scales linearly with each contributing metric', () => {
    const base = leaderboardService.calculateUserPoints({ xp: 100, currentStreak: 1 }, 1, 1);
    const doubledBadges = leaderboardService.calculateUserPoints(
      { xp: 100, currentStreak: 1 },
      2,
      1
    );

    expect(doubledBadges - base).toBe(100);
  });
});

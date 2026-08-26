/**
 * Unit Tests for Breakout Room Policy Catalog Utilities
 */

import { describe, it, expect } from 'vitest';
import { calculateBreakoutRoomsNeeded, BREAKOUT_ROOM_POLICIES } from './breakoutRoomPolicyCatalog';

describe('BreakoutRoomPolicyCatalog', () => {
  it('should calculate breakout rooms count needed for large study groups', () => {
    const rooms = calculateBreakoutRoomsNeeded(16, 6);
    expect(rooms).toBe(3);
  });

  it('should contain default breakout room policies', () => {
    expect(BREAKOUT_ROOM_POLICIES.length).toBeGreaterThanOrEqual(3);
  });
});

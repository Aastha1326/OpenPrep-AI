/**
 * Peer Study Group Breakout Room Partitioning & Load Balancing Catalog
 */

export const BREAKOUT_ROOM_POLICIES = [
  { policyName: 'Dynamic Subject-Based Breakout', maxMembersPerRoom: 6, autoRebalance: true },
  { policyName: 'Speed Review Blitz Pairs', maxMembersPerRoom: 2, autoRebalance: true },
  { policyName: 'Grand Rounds Discussion Forum', maxMembersPerRoom: 25, autoRebalance: false },
];

/**
 * Calculates required breakout rooms count.
 */
export function calculateBreakoutRoomsNeeded(totalActiveMembers: number, maxPerRoom = 6): number {
  return Math.max(1, Math.ceil(totalActiveMembers / maxPerRoom));
}

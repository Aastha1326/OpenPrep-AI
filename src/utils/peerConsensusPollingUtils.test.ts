/**
 * Unit Tests for Peer Consensus Polling Utilities
 */

import { describe, it, expect } from 'vitest';
import { calculateGroupConsensus } from './peerConsensusPollingUtils';

describe('PeerConsensusPollingUtils', () => {
  it('should calculate group consensus majority option and agreement percentage', () => {
    const res = calculateGroupConsensus([2, 12, 1, 1]); // Option B has 12 out of 16 votes (75%)
    expect(res.consensusOptionIndex).toBe(1);
    expect(res.consensusAgreementPercent).toBe(75.0);
    expect(res.isHighConsensus).toBe(true);
  });
});

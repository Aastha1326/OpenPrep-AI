/**
 * Unit Tests for Peer Chat Sentiment Utilities
 */

import { describe, it, expect } from 'vitest';
import { analyzePeerChatSentiment } from './peerChatSentimentUtils';

describe('PeerChatSentimentUtils', () => {
  it('should analyze study group chat messages for positive encouragement keywords', () => {
    const res = analyzePeerChatSentiment(['Great job on that cardiology vignette!', 'Thanks so much, very helpful explanation.']);
    expect(res).toBeDefined();
    expect(res.encouragementCount).toBeGreaterThan(0);
    expect(res.psychologicalSafetyRating).toBe('HIGHLY_SUPPORTIVE');
  });
});

/**
 * Peer Study Group Chat Sentiment & Psychological Safety Index
 */

export interface PeerSentimentMetrics {
  positivityScore: number;
  encouragementCount: number;
  psychologicalSafetyRating: 'HIGHLY_SUPPORTIVE' | 'MODERATE' | 'TOXIC_ALERT';
}

/**
 * Evaluates study group chat messaging sentiment to foster supportive peer learning environments.
 */
export function analyzePeerChatSentiment(messages: string[]): PeerSentimentMetrics {
  let positivity = 75;
  let encouragement = 0;

  const keywords = ['great', 'thanks', 'good job', 'helpful', 'awesome', 'correct'];

  for (const msg of messages) {
    const lower = msg.toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        positivity += 5;
        encouragement += 1;
      }
    }
  }

  const finalPositivity = Math.min(100, positivity);
  let safety: PeerSentimentMetrics['psychologicalSafetyRating'] = 'HIGHLY_SUPPORTIVE';
  if (finalPositivity < 50) safety = 'TOXIC_ALERT';
  else if (finalPositivity < 70) safety = 'MODERATE';

  return {
    positivityScore: finalPositivity,
    encouragementCount: encouragement,
    psychologicalSafetyRating: safety,
  };
}

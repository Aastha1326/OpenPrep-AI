/**
 * Peer Study Group Consensus Polling & Agreement Index Calculator
 */

export interface GroupConsensusMetrics {
  consensusOptionIndex: number;
  consensusAgreementPercent: number;
  isHighConsensus: boolean;
}

/**
 * Calculates group consensus index and majority option selection from peer responses.
 */
export function calculateGroupConsensus(optionCounts: number[]): GroupConsensusMetrics {
  let maxCount = 0;
  let maxIdx = 0;
  let total = 0;

  for (let i = 0; i < optionCounts.length; i++) {
    total += optionCounts[i];
    if (optionCounts[i] > maxCount) {
      maxCount = optionCounts[i];
      maxIdx = i;
    }
  }

  const agreement = total > 0 ? Math.round((maxCount / total) * 100.0 * 10) / 10 : 0;
  const isHigh = agreement >= 75.0;

  return {
    consensusOptionIndex: maxIdx,
    consensusAgreementPercent: agreement,
    isHighConsensus: isHigh,
  };
}

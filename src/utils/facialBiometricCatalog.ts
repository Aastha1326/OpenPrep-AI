/**
 * Mandatory Facial Verification & Biometric Match Verification Catalog
 */

export const FACIAL_BIOMETRIC_POLICIES = [
  { policyName: 'Continuous Facial Mesh Verification', targetConfidencePercent: 98.5 },
  { policyName: 'Anti-Spoofing Liveness Challenge', targetConfidencePercent: 99.2 },
  { policyName: 'ID Card Photo Similarity Comparison', targetConfidencePercent: 95.0 },
];

/**
 * Calculates facial match confidence score.
 */
export function calculateFacialMatchConfidence(embeddingDistance: number): number {
  return Math.max(0.0, Math.round((1.0 - embeddingDistance) * 100.0 * 10) / 10);
}

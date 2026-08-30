/**
 * Spaced Repetition Review Task Ingestion & Study Block Optimizer
 */

export interface IngestedReviewTask {
  reviewTaskId: string;
  topicName: string;
  urgencyDays: number;
}

export interface OptimizedStudyBlock {
  blockId: string;
  topicName: string;
  recommendedBlockDurationMinutes: number;
}

/**
 * Optimizes ingested spaced repetition review tasks into structured study blocks.
 */
export function optimizeIngestedReviewTasks(tasks: IngestedReviewTask[]): OptimizedStudyBlock[] {
  const sorted = [...tasks].sort((a, b) => a.urgencyDays - b.urgencyDays);

  return sorted.map(t => ({
    blockId: `BLK-${t.reviewTaskId}`,
    topicName: t.topicName,
    recommendedBlockDurationMinutes: t.urgencyDays <= 1 ? 90 : 45,
  }));
}

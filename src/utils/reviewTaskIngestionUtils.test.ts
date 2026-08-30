/**
 * Unit Tests for Review Task Ingestion Utilities
 */

import { describe, it, expect } from 'vitest';
import { optimizeIngestedReviewTasks } from './reviewTaskIngestionUtils';

describe('ReviewTaskIngestionUtils', () => {
  it('should optimize and prioritize urgent review tasks into study blocks', () => {
    const tasks = [
      { reviewTaskId: 'R1', topicName: 'Microbiology', urgencyDays: 5 },
      { reviewTaskId: 'R2', topicName: 'Cardiology', urgencyDays: 0 },
    ];

    const blocks = optimizeIngestedReviewTasks(tasks);
    expect(blocks.length).toBe(2);
    expect(blocks[0].topicName).toBe('Cardiology'); // Urgent task prioritized first
    expect(blocks[0].recommendedBlockDurationMinutes).toBe(90);
  });
});

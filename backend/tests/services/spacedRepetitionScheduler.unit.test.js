const spacedRepetitionScheduler = require('../../services/spacedRepetitionScheduler');
const DuplicateDetectionService = require('../../services/duplicateDetectionService');
const {
  SchedulerVersion,
  FlashcardSchedulingState,
  FlashcardReviewHistory,
  ReviewSubmissionToken,
} = require('../../models');

describe('Spaced Repetition Scheduler', () => {
  beforeEach(async () => {
    // Setup: Initialize scheduler version
    await spacedRepetitionScheduler.initializeSchedulerVersion();
  });

  describe('SM-2 Algorithm', () => {
    it('should advance interval for passing reviews', () => {
      const currentState = {
        repetitionCount: 1,
        interval: 3,
        easeFactor: 2.5,
      };

      const result = spacedRepetitionScheduler.calculateSM2(currentState, 5);

      expect(result.repetitionCount).toBe(2);
      expect(result.interval).toBeGreaterThan(3);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('should reset interval for failing reviews', () => {
      const currentState = {
        repetitionCount: 5,
        interval: 30,
        easeFactor: 2.5,
      };

      const result = spacedRepetitionScheduler.calculateSM2(currentState, 2);

      expect(result.repetitionCount).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('should not allow ease factor below 1.3', () => {
      const currentState = {
        repetitionCount: 1,
        interval: 1,
        easeFactor: 1.5,
      };

      const result = spacedRepetitionScheduler.calculateSM2(currentState, 0);

      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should validate quality parameter', () => {
      const currentState = {
        repetitionCount: 1,
        interval: 1,
        easeFactor: 2.5,
      };

      expect(() => spacedRepetitionScheduler.calculateSM2(currentState, 6)).toThrow();
      expect(() => spacedRepetitionScheduler.calculateSM2(currentState, -1)).toThrow();
    });
  });

  describe('Duplicate Detection', () => {
    it('should reject duplicate submissions', async () => {
      const flashcardId = 'card-123';
      const token = 'token-abc';

      // First submission succeeds
      const result1 = await spacedRepetitionScheduler.processReview(
        flashcardId,
        5,
        token,
        'UTC'
      );
      expect(result1.success).toBe(true);

      // Second with same token should fail
      const result2 = await spacedRepetitionScheduler.processReview(
        flashcardId,
        5,
        token,
        'UTC'
      );
      expect(result2.isDuplicate).toBe(true);
      expect(result2.success).toBe(false);
    });

    it('should generate unique submission tokens', () => {
      const flashcardId = 'card-123';
      const token1 = DuplicateDetectionService.generateSubmissionToken(flashcardId);
      const token2 = DuplicateDetectionService.generateSubmissionToken(flashcardId);

      expect(token1).not.toBe(token2);
      expect(token1).toContain(flashcardId);
    });
  });

  describe('Timezone Handling', () => {
    it('should store and retrieve timezone information', async () => {
      const flashcardId = 'card-tz-test';
      const timezone = 'America/New_York';

      await spacedRepetitionScheduler.initializeFlashcardScheduling(flashcardId, timezone);

      const state = await spacedRepetitionScheduler.getSchedulingState(flashcardId);

      expect(state.timezoneIdentifier).toBe(timezone);
    });

    it('should calculate next review date consistently', async () => {
      const flashcardId = 'card-date-test';
      await spacedRepetitionScheduler.initializeFlashcardScheduling(flashcardId, 'UTC');

      const token = DuplicateDetectionService.generateSubmissionToken(flashcardId);
      await spacedRepetitionScheduler.processReview(flashcardId, 4, token, 'UTC');

      const state = await spacedRepetitionScheduler.getSchedulingState(flashcardId);

      expect(state.nextReviewDate).toBeInstanceOf(Date);
      expect(state.nextReviewDate.getTime()).toBeGreaterThan(new Date().getTime());
    });
  });

  describe('Transaction Atomicity', () => {
    it('should record complete review history entry', async () => {
      const flashcardId = 'card-history-test';
      await spacedRepetitionScheduler.initializeFlashcardScheduling(flashcardId, 'UTC');

      const token = DuplicateDetectionService.generateSubmissionToken(flashcardId);
      const result = await spacedRepetitionScheduler.processReview(flashcardId, 4, token, 'UTC');

      expect(result.success).toBe(true);
      expect(result.reviewHistory).toBeDefined();
      expect(result.reviewHistory.preState).toBeDefined();
      expect(result.reviewHistory.postState).toBeDefined();
    });

    it('should fail gracefully on concurrent access', async () => {
      const flashcardId = 'card-concurrent-test';
      await spacedRepetitionScheduler.initializeFlashcardScheduling(flashcardId, 'UTC');

      const token1 = DuplicateDetectionService.generateSubmissionToken(flashcardId);
      const token2 = DuplicateDetectionService.generateSubmissionToken(flashcardId);

      // Process both concurrently
      const results = await Promise.allSettled([
        spacedRepetitionScheduler.processReview(flashcardId, 4, token1, 'UTC'),
        spacedRepetitionScheduler.processReview(flashcardId, 3, token2, 'UTC'),
      ]);

      // Both should complete without corrupting state
      expect(results.every(r => r.status === 'fulfilled')).toBe(true);

      // Verify final state is consistent
      const finalState = await spacedRepetitionScheduler.getSchedulingState(flashcardId);
      expect(finalState.repetitionCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Review History', () => {
    it('should retrieve review history for a flashcard', async () => {
      const flashcardId = 'card-history-retrieval-test';
      await spacedRepetitionScheduler.initializeFlashcardScheduling(flashcardId, 'UTC');

      const token = DuplicateDetectionService.generateSubmissionToken(flashcardId);
      await spacedRepetitionScheduler.processReview(flashcardId, 4, token, 'UTC');

      const history = await spacedRepetitionScheduler.getReviewHistory(flashcardId);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].quality).toBe(4);
    });
  });

  describe('Cards Due for Review', () => {
    it('should return overdue cards', async () => {
      const flashcardId = 'card-overdue-test';
      const state = await spacedRepetitionScheduler.initializeFlashcardScheduling(
        flashcardId,
        'UTC'
      );

      // Manually set nextReviewDate to past
      await state.update({
        nextReviewDate: new Date(Date.now() - 86400000), // 1 day ago
      });

      const dueCards = await spacedRepetitionScheduler.getCardsDueForReview();

      const isDueCardFound = dueCards.some(card => card.flashcardId === flashcardId);
      expect(isDueCardFound).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should reject invalid quality scores', async () => {
      const flashcardId = 'card-invalid-quality';
      await spacedRepetitionScheduler.initializeFlashcardScheduling(flashcardId, 'UTC');

      const token = DuplicateDetectionService.generateSubmissionToken(flashcardId);

      await expect(
        spacedRepetitionScheduler.processReview(flashcardId, 10, token, 'UTC')
      ).rejects.toThrow();
    });
  });
});
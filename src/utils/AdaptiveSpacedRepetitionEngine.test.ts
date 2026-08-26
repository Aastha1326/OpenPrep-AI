/**
 * Adaptive Spaced Repetition (SuperMemo SM-2) Flashcard Service Unit Test Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AdaptiveSpacedRepetitionEngine,
  QUALITY_RATINGS,
  FlashcardState,
} from './AdaptiveSpacedRepetitionEngine';

describe('AdaptiveSpacedRepetitionEngine', () => {
  let engine: AdaptiveSpacedRepetitionEngine;

  const sampleCard: FlashcardState = {
    cardId: 'CARD-101',
    deckId: 'DECK-USMLE-MED',
    prompt: 'What is the first-line antibiotic treatment for acute uncomplicated pyelonephritis?',
    answer: 'Fluoroquinolones (e.g. Ciprofloxacin 500mg BID) or Ceftriaxone.',
    repetitionNumber: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    nextReviewDueDate: '2026-08-25T12:00:00Z',
    totalReviewsCount: 0,
    lapseCount: 0,
  };

  beforeEach(() => {
    engine = new AdaptiveSpacedRepetitionEngine();
  });

  it('should calculate initial SM-2 interval for first successful review (QUALITY 4 - GOOD)', () => {
    const updated = engine.processFlashcardReview(sampleCard, QUALITY_RATINGS.GOOD, '2026-08-25T14:00:00Z');

    expect(updated).toBeDefined();
    expect(updated.repetitionNumber).toBe(1);
    expect(updated.intervalDays).toBe(1);
    expect(updated.easeFactor).toBe(2.5); // Ease factor remains unchanged at 2.5 for quality 4
    expect(updated.totalReviewsCount).toBe(1);
  });

  it('should scale interval exponentially on consecutive successful reviews (QUALITY 5 - PERFECT)', () => {
    let card = engine.processFlashcardReview(sampleCard, QUALITY_RATINGS.PERFECT, '2026-08-25T14:00:00Z');
    // First review -> interval = 1
    expect(card.intervalDays).toBe(1);

    card = engine.processFlashcardReview(card, QUALITY_RATINGS.PERFECT, '2026-08-26T14:00:00Z');
    // Second review -> interval = 6
    expect(card.intervalDays).toBe(6);

    card = engine.processFlashcardReview(card, QUALITY_RATINGS.PERFECT, '2026-09-01T14:00:00Z');
    // Third review -> interval = 6 * 2.6 = ~16 days
    expect(card.intervalDays).toBeGreaterThanOrEqual(15);
    expect(card.easeFactor).toBeGreaterThan(2.5);
  });

  it('should handle card lapses (QUALITY 1 - WRONG) and reset repetition count', () => {
    let card = engine.processFlashcardReview(sampleCard, QUALITY_RATINGS.PERFECT, '2026-08-25T14:00:00Z');
    card = engine.processFlashcardReview(card, QUALITY_RATINGS.PERFECT, '2026-08-26T14:00:00Z');

    const lapsedCard = engine.processFlashcardReview(card, QUALITY_RATINGS.BLACKOUT, '2026-09-01T14:00:00Z');

    expect(lapsedCard.repetitionNumber).toBe(0);
    expect(lapsedCard.intervalDays).toBe(1);
    expect(lapsedCard.lapseCount).toBe(1);
    expect(lapsedCard.easeFactor).toBeLessThan(card.easeFactor);
  });

  it('should calculate deck mastery and retention metrics', () => {
    const cards: FlashcardState[] = [
      { ...sampleCard, cardId: 'C1', intervalDays: 30, totalReviewsCount: 5 },
      { ...sampleCard, cardId: 'C2', intervalDays: 1, totalReviewsCount: 1 },
      { ...sampleCard, cardId: 'C3', intervalDays: 0, totalReviewsCount: 0 },
    ];

    const metrics = engine.calculateDeckMasteryMetrics(cards);
    expect(metrics.totalCards).toBe(3);
    expect(metrics.masteredCardsCount).toBe(1); // interval >= 21 days
    expect(metrics.learningCardsCount).toBe(1);
    expect(metrics.newCardsCount).toBe(1);
  });
});

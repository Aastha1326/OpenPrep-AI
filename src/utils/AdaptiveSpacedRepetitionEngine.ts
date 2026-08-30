/**
 * Adaptive Spaced Repetition (SuperMemo SM-2 Algorithm) Flashcard Engine
 * Calculates dynamic review intervals, optimal ease factors, memory decay curves,
 * and deck mastery retention telemetry for competitive exam preparation (USMLE, GATE, MCAT).
 */

export const QUALITY_RATINGS = {
  BLACKOUT: 0, // Complete blackout / failed recall
  INCORRECT: 1, // Incorrect response, but recalled upon seeing answer
  HARD: 2, // Correct response recalled with major hesitation
  GOOD: 3, // Correct response after moderate hesitation
  EASY: 4, // Perfect recall with minimal effort
  PERFECT: 5, // Instantaneous perfect recall
};

export interface FlashcardState {
  cardId: string;
  deckId: string;
  prompt: string;
  answer: string;
  repetitionNumber: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDueDate: string;
  totalReviewsCount: number;
  lapseCount: number;
}

export interface DeckMasteryMetrics {
  totalCards: number;
  masteredCardsCount: number; // interval >= 21 days
  learningCardsCount: number;  // interval < 21 days & reviews > 0
  newCardsCount: number;       // totalReviewsCount == 0
  averageEaseFactor: number;
  estimatedRetentionRatePercent: number;
}

export class AdaptiveSpacedRepetitionEngine {
  private readonly MIN_EASE_FACTOR = 1.3;

  /**
   * Processes a flashcard review rating using SuperMemo SM-2 algorithm rules.
   */
  public processFlashcardReview(
    card: FlashcardState,
    qualityRating: number,
    reviewTimestamp = new Date().toISOString()
  ): FlashcardState {
    const q = Math.max(0, Math.min(5, Math.floor(qualityRating)));
    let nextRepetition = card.repetitionNumber;
    let nextInterval = card.intervalDays;
    let nextLapse = card.lapseCount;

    // Recalculate SM-2 Ease Factor (EF)
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    let newEaseFactor = card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (newEaseFactor < this.MIN_EASE_FACTOR) {
      newEaseFactor = this.MIN_EASE_FACTOR;
    }

    if (q < QUALITY_RATINGS.GOOD) {
      // Failed recall (Lapse)
      nextRepetition = 0;
      nextInterval = 1;
      nextLapse += 1;
    } else {
      // Successful recall
      if (nextRepetition === 0) {
        nextInterval = 1;
      } else if (nextRepetition === 1) {
        nextInterval = 6;
      } else {
        nextInterval = Math.round(card.intervalDays * newEaseFactor);
      }
      nextRepetition += 1;
    }

    // Compute next due date
    const reviewDate = new Date(reviewTimestamp);
    const dueDate = new Date(reviewDate.getTime() + nextInterval * 24 * 60 * 60 * 1000);

    return {
      ...card,
      repetitionNumber: nextRepetition,
      intervalDays: nextInterval,
      easeFactor: Math.round(newEaseFactor * 100) / 100,
      nextReviewDueDate: dueDate.toISOString(),
      totalReviewsCount: card.totalReviewsCount + 1,
      lapseCount: nextLapse,
    };
  }

  /**
   * Calculates overall deck retention stability and mastery distribution metrics.
   */
  public calculateDeckMasteryMetrics(cards: FlashcardState[]): DeckMasteryMetrics {
    if (cards.length === 0) {
      return {
        totalCards: 0,
        masteredCardsCount: 0,
        learningCardsCount: 0,
        newCardsCount: 0,
        averageEaseFactor: 2.5,
        estimatedRetentionRatePercent: 0.0,
      };
    }

    let mastered = 0;
    let learning = 0;
    let newCards = 0;
    let totalEase = 0.0;

    for (const card of cards) {
      totalEase += card.easeFactor;
      if (card.totalReviewsCount === 0) {
        newCards += 1;
      } else if (card.intervalDays >= 21) {
        mastered += 1;
      } else {
        learning += 1;
      }
    }

    const avgEase = Math.round((totalEase / cards.length) * 100) / 100;
    const retentionRate = Math.round(((mastered * 0.95 + learning * 0.70) / cards.length) * 100.0 * 10) / 10;

    return {
      totalCards: cards.length,
      masteredCardsCount: mastered,
      learningCardsCount: learning,
      newCardsCount: newCards,
      averageEaseFactor: avgEase,
      estimatedRetentionRatePercent: retentionRate,
    };
  }

  /**
   * Filters cards due for review as of the target timestamp.
   */
  public getDueCards(cards: FlashcardState[], targetTimestamp = new Date().toISOString()): FlashcardState[] {
    const targetDate = new Date(targetTimestamp).getTime();
    return cards.filter(card => new Date(card.nextReviewDueDate).getTime() <= targetDate);
  }
}

/**
 * Leitner 5-Box Spaced Repetition System Utilities
 */

export interface LeitnerBoxState {
  boxNumber: number; // 1 to 5
  reviewIntervalDays: number;
  capacityCardsCount: number;
}

export const LEITNER_BOX_SCHEDULE: LeitnerBoxState[] = [
  { boxNumber: 1, reviewIntervalDays: 1, capacityCardsCount: 50 },
  { boxNumber: 2, reviewIntervalDays: 3, capacityCardsCount: 100 },
  { boxNumber: 3, reviewIntervalDays: 7, capacityCardsCount: 200 },
  { boxNumber: 4, reviewIntervalDays: 14, capacityCardsCount: 400 },
  { boxNumber: 5, reviewIntervalDays: 30, capacityCardsCount: 800 },
];

/**
 * Moves a flashcard up or down Leitner boxes based on recall outcome.
 */
export function promoteOrDemoteLeitnerBox(currentBox: number, isRecallSuccessful: boolean): number {
  if (isRecallSuccessful) {
    return Math.min(5, currentBox + 1);
  }
  return 1; // Failed recall demotes back to Box 1
}

import { describe, it, expect } from 'vitest';
import deckVersionService from '../../services/deckVersionService';

describe('DeckVersionService & 3-Way Card Diff Unit Tests', () => {
  const baseCards = [
    { id: '1', front: 'What is a Semaphore?', back: 'A signaling mechanism integer.' },
    { id: '2', front: 'What is Deadlock?', back: 'A state where processes wait indefinitely.' },
  ];

  it('should accurately detect ADDED, MODIFIED, and DELETED cards', () => {
    const proposedCards = [
      { id: '1', front: 'What is a Semaphore?', back: 'A synchronization tool using wait() and signal().' }, // Modified
      { id: '3', front: 'What is Starvation?', back: 'Indefinite delay without deadlock.' }, // Added
      // card 2 deleted
    ];

    const result = deckVersionService.computeCardDiffs(baseCards, proposedCards);

    expect(result.summary.addedCount).toBe(1);
    expect(result.summary.modifiedCount).toBe(1);
    expect(result.summary.deletedCount).toBe(1);
    expect(result.diffs.added[0].id).toBe('3');
    expect(result.diffs.modified[0].after.back).toContain('synchronization tool');
  });

  it('should apply diffs to produce clean merged deck state', () => {
    const proposedCards = [
      { id: '1', front: 'What is a Semaphore?', back: 'A synchronization tool.' },
      { id: '3', front: 'What is Starvation?', back: 'Indefinite delay.' },
    ];
    const diffReport = deckVersionService.computeCardDiffs(baseCards, proposedCards);
    const merged = deckVersionService.applyDiffs(baseCards, diffReport);

    expect(merged.length).toBe(2);
    expect(merged.find((c) => c.id === '1').back).toBe('A synchronization tool.');
    expect(merged.find((c) => c.id === '3')).toBeDefined();
    expect(merged.find((c) => c.id === '2')).toBeUndefined();
  });
});

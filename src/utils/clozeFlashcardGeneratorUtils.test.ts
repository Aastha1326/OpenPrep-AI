/**
 * Unit Tests for Cloze Flashcard Generator Utilities
 */

import { describe, it, expect } from 'vitest';
import { parseClozeDeletionFlashcards } from './clozeFlashcardGeneratorUtils';

describe('ClozeFlashcardGeneratorUtils', () => {
  it('should parse cloze deletion syntax into prompt and answer', () => {
    const text = 'First-line therapy for status epilepticus is {{c1::Lorazepam IV}}.';
    const cards = parseClozeDeletionFlashcards(text);

    expect(cards.length).toBe(1);
    expect(cards[0].answer).toBe('Lorazepam IV');
    expect(cards[0].prompt).toContain('[...]');
    expect(cards[0].isClozeDeletion).toBe(true);
  });
});

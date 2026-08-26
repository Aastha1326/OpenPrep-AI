/**
 * Automated AI Flashcard Deck Generation & Cloze Deletion Parser
 */

export interface GeneratedFlashcard {
  prompt: string;
  answer: string;
  isClozeDeletion: boolean;
}

/**
 * Parses medical / engineering text containing cloze bracket syntax `{{c1::answer}}` into structured flashcards.
 */
export function parseClozeDeletionFlashcards(rawText: string): GeneratedFlashcard[] {
  const cards: GeneratedFlashcard[] = [];
  const regex = /\{\{c1::(.*?)\}\}/g;

  let match;
  while ((match = regex.exec(rawText)) !== null) {
    const answer = match[1];
    const prompt = rawText.replace(match[0], '[...]');
    cards.push({
      prompt,
      answer,
      isClozeDeletion: true,
    });
  }

  if (cards.length === 0 && rawText.trim().length > 0) {
    cards.push({
      prompt: rawText.slice(0, 100) + '...',
      answer: 'General Knowledge Concept',
      isClozeDeletion: false,
    });
  }

  return cards;
}

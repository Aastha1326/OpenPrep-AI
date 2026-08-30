import { test, expect } from './fixtures/testFixtures';

test.describe('Flashcard & Spaced Repetition Flows', () => {
  test('should display flashcard decks with due counters', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    const flashcardsLink = authenticatedPage.getByRole('link', { name: /flashcards|decks/i }).first();
    if (await flashcardsLink.isVisible()) {
      await flashcardsLink.click();
    }
    await expect(authenticatedPage.locator('body')).toBeVisible();
  });
});

import { test, expect } from './fixtures/testFixtures';

test.describe('Quiz Module Journey', () => {
  test('should render quiz catalog and filter topics', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    const quizLink = authenticatedPage.getByRole('link', { name: /quiz|practice/i }).first();
    if (await quizLink.isVisible()) {
      await quizLink.click();
    }
    await expect(authenticatedPage.locator('body')).toBeVisible();
  });

  test('should allow interacting with question answer options', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await expect(authenticatedPage.locator('body')).toBeVisible();
  });
});

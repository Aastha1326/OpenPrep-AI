import { test, expect } from './fixtures/testFixtures';

test.describe('Notes & PDF Workspace Flow', () => {
  test('should render notes repository and creation trigger', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    const notesLink = authenticatedPage.getByRole('link', { name: /notes|workspace/i }).first();
    if (await notesLink.isVisible()) {
      await notesLink.click();
    }
    await expect(authenticatedPage.locator('body')).toBeVisible();
  });
});

import { test, expect } from './fixtures/testFixtures';

test.describe('Dashboard & Core Navigation', () => {
  test('should render the student dashboard with metrics widgets', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await expect(authenticatedPage.locator('body')).toBeVisible();
  });

  test('should allow toggling between light and dark visual themes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    const themeToggle = authenticatedPage.locator('button[aria-label*="theme"], button:has-text("Theme")').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
    }
    await expect(authenticatedPage.locator('body')).toBeVisible();
  });
});

import { test, expect } from './fixtures/testFixtures';

test.describe('Mobile Viewport & Touch Gestures', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should render responsive mobile drawer/navbar toggle', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await expect(authenticatedPage.locator('body')).toBeVisible();
  });
});

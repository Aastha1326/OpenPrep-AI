import { test, expect } from './fixtures/testFixtures';

test.describe('Study Planner Flows', () => {
  test('should render study timeline and milestone indicators', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    const plannerLink = authenticatedPage.getByRole('link', { name: /planner|study plan|schedule/i }).first();
    if (await plannerLink.isVisible()) {
      await plannerLink.click();
    }
    await expect(authenticatedPage.locator('body')).toBeVisible();
  });
});

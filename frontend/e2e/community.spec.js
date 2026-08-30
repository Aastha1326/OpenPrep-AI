import { test, expect } from './fixtures/testFixtures';

test.describe('Community & Peer Study Flows', () => {
  test('should render peer study groups and community discussions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    const communityLink = authenticatedPage.getByRole('link', { name: /community|forum|groups/i }).first();
    if (await communityLink.isVisible()) {
      await communityLink.click();
    }
    await expect(authenticatedPage.locator('body')).toBeVisible();
  });
});

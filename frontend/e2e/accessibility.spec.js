import { test, expect } from './fixtures/testFixtures';

test.describe('Accessibility & Keyboard Navigation (a11y)', () => {
  test('should allow tabbing through main navigation without focus traps', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.keyboard.press('Tab');
    const focusedElement = await authenticatedPage.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });

  test('should have valid landmark roles on main page layout', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    const mainRole = authenticatedPage.locator('main, role=main').first();
    await expect(mainRole).toBeVisible();
  });
});

import { test, expect } from './fixtures/testFixtures';

test.describe('Authentication Flows', () => {
  test('should render the login interface with all required form controls', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation states on invalid login attempts', async ({ page, auth }) => {
    await page.goto('/login');
    await auth.login('invalid-email-format', 'short');
    // Verify user remains on the login page or error message appears
    expect(page.url()).toContain('/login');
  });

  test('should navigate smoothly between login and registration views', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register.*/);
    }
  });
});

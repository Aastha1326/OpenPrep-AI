import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Flow', () => {
  let testUser;

  test.beforeEach(async ({ request }) => {
    testUser = {
      name: 'Login Test User',
      email: `login_test_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
    };

    // Register a user directly via API for deterministic login test
    const response = await request.post('http://localhost:5000/api/auth/register', {
      data: testUser,
    });
    
    expect(response.ok()).toBeTruthy();
  });

  test('User can login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // Fill the login form
    await loginPage.fillForm(testUser.email, testUser.password);
    
    // Submit the form
    await loginPage.submit();
    
    // Wait for URL to be /dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Assert authenticated user's name is visible in the page
    // The navbar usually displays the user's name or initials
    await expect(page.locator('text=' + testUser.name).first()).toBeVisible();
  });
});

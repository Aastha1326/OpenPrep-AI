import { test, expect } from '@playwright/test';
import { RegistrationPage } from '../pages/RegistrationPage';

test.describe('Registration Flow', () => {
  test('User can register successfully', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    
    await registrationPage.goto();
    
    // Fill the registration form
    await registrationPage.fillForm('Test User', uniqueEmail, 'TestPassword123!');
    
    // Submit the form
    await registrationPage.submit();
    
    // Wait for URL to be /dashboard or expect an element on dashboard to be visible
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Assert dashboard is visible
    await expect(page.locator('text=Test User').first()).toBeVisible();
  });
});

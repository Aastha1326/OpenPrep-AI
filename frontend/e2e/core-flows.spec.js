import { test, expect } from '@playwright/test';

test.describe('OpenPrep AI Core User Journeys', () => {
  
  test('should allow a new user to register and land on dashboard', async ({ page }) => {
    // 1. Go to register page
    await page.goto('/register');
    await expect(page).toHaveTitle(/Create Account|OpenPrep AI/);

    // 2. Fill in form fields
    const randomEmail = `student-${Date.now()}@openprep.ai`;
    await page.fill('#register-name', 'Test Scholar');
    await page.fill('#register-email', randomEmail);
    await page.fill('#register-password', 'SecurePassword123!');

    // 3. Submit registration
    await page.click('button[type="submit"]');

    // 4. In development/testing environment, register auto-logs in
    // Wait for the redirection to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('text=Welcome back, Test')).toBeVisible();
    await expect(page.locator('text=Level 1')).toBeVisible();
  });

  test('should allow an existing user to log in', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/Welcome Back|OpenPrep AI/);

    // 2. Fill in credentials (using pre-seeded student account)
    await page.fill('#login-email', 'student@openprep.ai');
    await page.fill('#login-password', 'Password123');

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Wait for dashboard redirection
    await page.waitForURL('**/dashboard');
    await expect(page.locator('text=Welcome back, Demo')).toBeVisible();
    await expect(page.locator('text=Level 1')).toBeVisible();
  });

  test('should display visual progression elements on the dashboard', async ({ page }) => {
    // 1. Perform login
    await page.goto('/login');
    await page.fill('#login-email', 'student@openprep.ai');
    await page.fill('#login-password', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 2. Verify Level and XP progression display
    await expect(page.locator('text=Level 1')).toBeVisible();
    await expect(page.locator('text=0 / 1000 XP')).toBeVisible();

    // 3. Verify quick action controls are rendered
    await expect(page.locator('text=Start Quiz')).toBeVisible();
    await expect(page.locator('text=PYQ Intelligence')).toBeVisible();
    await expect(page.locator('text=Study Plan')).toBeVisible();
  });

  test('should navigate to AI Study Assistant and render voice query options', async ({ page }) => {
    // 1. Perform login
    await page.goto('/login');
    await page.fill('#login-email', 'student@openprep.ai');
    await page.fill('#login-password', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 2. Click AI Study Assistant quick link
    await page.click('text=AI Study Assistant');
    await page.waitForURL('**/ai-assistant');

    // 3. Verify page content
    await expect(page.locator('text=AI Study Mentor')).toBeVisible();
    await expect(page.locator('placeholder=Speak or type your concept question here...')).toBeVisible();
  });
});

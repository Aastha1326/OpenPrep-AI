/**
 * E2E Authentication Helper functions
 */

export class AuthHelper {
  constructor(page) {
    this.page = page;
  }

  async login(email = 'testuser@openprep.ai', password = 'Password123!') {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"], input[name="email"]', email);
    await this.page.fill('input[type="password"], input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async register(name = 'Test Student', email = 'newstudent@openprep.ai', password = 'Password123!') {
    await this.page.goto('/register');
    const nameInput = this.page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill(name);
    }
    await this.page.fill('input[type="email"], input[name="email"]', email);
    await this.page.fill('input[type="password"], input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async mockAuthenticatedSession() {
    await this.page.addInitScript(() => {
      window.localStorage.setItem('token', 'mocked_jwt_token_for_e2e_testing');
      window.localStorage.setItem('user', JSON.stringify({
        id: 'mock-user-uuid',
        name: 'E2E Test User',
        email: 'testuser@openprep.ai',
        role: 'student',
        xp: 1250,
        streakCount: 14,
      }));
    });
  }
}

export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.signInButton = page.getByRole('button', { name: /Sign In/i, exact: true });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async fillForm(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.signInButton.click();
  }
}

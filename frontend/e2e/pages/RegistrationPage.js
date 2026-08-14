export class RegistrationPage {
  constructor(page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.signUpButton = page.getByRole('button', { name: /Sign Up/i, exact: true });
  }

  async goto() {
    await this.page.goto('/register');
  }

  async fillForm(name, email, password) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.signUpButton.click();
  }
}

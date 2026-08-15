export class QuizPage {
  constructor(page) {
    this.page = page;
    this.startQuizButton = page.getByRole('button', { name: /Start Quiz/i });
    this.subjectSelect = page.locator('select').first(); // We'll just select the first available or we can use labels
    this.generateButton = page.getByRole('button', { name: /Generate Quiz/i, exact: true });
    
    // Within quiz session
    this.submitQuizButton = page.getByRole('button', { name: /Submit Quiz/i });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async openQuizSetup() {
    await this.startQuizButton.click();
  }

  async generateQuiz(subjectValue) {
    if (subjectValue) {
      await this.subjectSelect.selectOption({ label: subjectValue });
    }
    await this.generateButton.click();
  }

  async submitQuiz() {
    await this.submitQuizButton.click();
  }
}

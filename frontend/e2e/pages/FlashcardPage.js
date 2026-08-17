export class FlashcardPage {
  constructor(page) {
    this.page = page;
    this.createFlashcardButton = page.getByRole('button', { name: /Create Flashcard/i });
    this.frontInput = page.getByPlaceholder('Front (question/term)');
    this.backInput = page.getByPlaceholder('Back (answer/definition)');
    this.saveButton = page.getByRole('button', { name: /Save Flashcard/i });
  }

  async goto() {
    await this.page.goto('/flashcards');
  }

  async openCreateModal() {
    await this.createFlashcardButton.click();
  }

  async fillCard(front, back) {
    await this.frontInput.fill(front);
    await this.backInput.fill(back);
  }

  async saveCard() {
    await this.saveButton.click();
  }
}

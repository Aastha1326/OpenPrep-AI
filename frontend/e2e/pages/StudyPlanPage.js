export class StudyPlanPage {
  constructor(page) {
    this.page = page;
    this.studyPlanButton = page.getByRole('button', { name: /Study Plan/i });
    this.createPlanButton = page.getByRole('button', { name: /Create Plan/i, exact: true });
    
    // Form fields
    this.examSelect = page.locator('select').first();
    this.startDateInput = page.locator('input[type="date"]').first();
    this.endDateInput = page.locator('input[type="date"]').nth(1);
    this.hoursInput = page.locator('input[type="number"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async openStudyPlan() {
    await this.studyPlanButton.click();
  }

  async createPlan(examValue) {
    if (examValue) {
      await this.examSelect.selectOption({ label: examValue });
    }
    await this.createPlanButton.click();
  }
}

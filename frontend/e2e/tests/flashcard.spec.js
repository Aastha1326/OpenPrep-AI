import { test, expect } from '@playwright/test';
import { FlashcardPage } from '../pages/FlashcardPage';
import { registerAndLoginViaApi } from '../utils/auth';

test.describe('Flashcard Flow', () => {
  let authInfo;

  test.beforeEach(async ({ page, request, context }) => {
    authInfo = await registerAndLoginViaApi(request, context);
    
    // Mock the subjects API so dropdown doesn't crash if it tries to load subjects
    await page.route('**/api/academic/subjects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'mock-sub-1', name: 'Mock Subject' }]
        }),
      });
    });

    // Mock initial flashcards GET
    let flashcards = [];
    
    await page.route('**/api/flashcards*', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: flashcards,
            total: flashcards.length,
            page: 1,
            pages: 1
          }),
        });
      } else if (request.method() === 'POST') {
        // Intercept creation
        const postData = JSON.parse(request.postData());
        const newCard = {
          id: `card-${Date.now()}`,
          front: postData.front,
          back: postData.back,
          subject: postData.subjectId || 'mock-sub-1',
          createdAt: new Date().toISOString()
        };
        flashcards.push(newCard); // Add to our mocked state
        
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: newCard
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('User can create and view a Flashcard', async ({ page }) => {
    const flashcardPage = new FlashcardPage(page);
    await flashcardPage.goto();
    
    // Open create modal
    await flashcardPage.openCreateModal();
    
    // Fill the form
    const frontText = 'What is the capital of France?';
    const backText = 'Paris';
    await flashcardPage.fillCard(frontText, backText);
    
    // Save
    await flashcardPage.saveCard();
    
    // The modal should close and card appear in the list
    await expect(page.locator(`text=${frontText}`)).toBeVisible();
  });
});

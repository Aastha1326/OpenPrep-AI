import { test, expect } from '@playwright/test';
import { QuizPage } from '../pages/QuizPage';
import { registerAndLoginViaApi } from '../utils/auth';

test.describe('Quiz Flow', () => {
  let authInfo;

  test.beforeEach(async ({ page, request, context }) => {
    authInfo = await registerAndLoginViaApi(request, context);
    
    // Mock the subjects API so the dropdown has options
    await page.route('**/api/academic/subjects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'mock-sub-1', name: 'Mock Subject', description: 'Desc' }]
        }),
      });
    });

    // Mock the topics API
    await page.route('**/api/academic/topics?subjectId=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'mock-topic-1', name: 'Mock Topic', subject: 'mock-sub-1' }]
        }),
      });
    });

    // Mock the AI quiz generation API
    await page.route('**/api/quizzes/generate-ai', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'mock-quiz-1',
            title: 'Mock AI Quiz',
            questions: [
              {
                _id: 'q1',
                questionText: 'What is 2+2?',
                options: ['3', '4', '5', '6'],
                correctAnswer: 1, // index 1 which is '4'
                explanation: 'Basic math.'
              }
            ]
          }
        }),
      });
    });

    // Mock the specific quiz fetch when navigating to /quiz/:id
    await page.route('**/api/quizzes/mock-quiz-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'mock-quiz-1',
            title: 'Mock AI Quiz',
            questions: [
              {
                _id: 'q1',
                questionText: 'What is 2+2?',
                options: ['3', '4', '5', '6'],
                correctAnswer: 1,
                explanation: 'Basic math.'
              }
            ]
          }
        }),
      });
    });
  });

  test('User can generate and view AI Quiz', async ({ page }) => {
    const quizPage = new QuizPage(page);
    await quizPage.goto();
    
    await quizPage.openQuizSetup();
    
    // Generate Quiz (the subject select should be populated by mock)
    await quizPage.generateQuiz();
    
    // Assert redirect to quiz session and rendering of question
    await page.waitForURL('**/quiz/mock-quiz-1', { timeout: 10000 });
    
    await expect(page.locator('text=What is 2+2?')).toBeVisible();
    
    // Complete the quiz
    await page.locator('text=4').click();
    await quizPage.submitQuiz();
    
    // Optionally assert success state / results are shown
    await expect(page.locator('text=Score')).toBeVisible();
  });
});

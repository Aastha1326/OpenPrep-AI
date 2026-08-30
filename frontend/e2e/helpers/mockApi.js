/**
 * E2E API Mocking utilities
 */

export async function setupApiMocks(page) {
  // Mock User Profile
  await page.route('**/api/users/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: {
          id: 'mock-user-1',
          name: 'OpenPrep Scholar',
          email: 'scholar@openprep.ai',
          xp: 4500,
          streak: 21,
          role: 'student',
        },
      }),
    });
  });

  // Mock Quizzes List
  await page.route('**/api/quizzes', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        quizzes: [
          { id: 'q1', title: 'Data Structures & Algorithms', subject: 'Computer Science', questionsCount: 15 },
          { id: 'q2', title: 'Linear Algebra Fundamentals', subject: 'Mathematics', questionsCount: 10 },
        ],
      }),
    });
  });

  // Mock Flashcard Decks
  await page.route('**/api/flashcards/decks', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        decks: [
          { id: 'd1', name: 'Operating Systems Core', totalCards: 42, dueToday: 8 },
          { id: 'd2', name: 'Database Management Systems', totalCards: 30, dueToday: 5 },
        ],
      }),
    });
  });
}

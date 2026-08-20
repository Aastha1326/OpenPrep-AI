import { test, expect } from '@playwright/test';
import { StudyPlanPage } from '../pages/StudyPlanPage';
import { registerAndLoginViaApi } from '../utils/auth';

test.describe('Study Plan Flow', () => {
  let authInfo;

  test.beforeEach(async ({ page, request, context }) => {
    authInfo = await registerAndLoginViaApi(request, context);
    
    // Mock the exams API so the dropdown is populated
    await page.route('**/api/exams', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'mock-exam-1', name: 'Mock Final Exam', date: '2026-12-01' }]
        }),
      });
    });

    // Mock Study Plan active plan GET
    await page.route('**/api/study-plans/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: null // No active plan initially
        }),
      });
    });

    // Mock Study Plan Generation POST
    await page.route('**/api/study-plans/generate', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'mock-plan-1',
            status: 'active',
            dailyGoals: [
              {
                date: '2026-08-15',
                tasks: [
                  { title: 'Read Chapter 1', duration: 60, completed: false }
                ]
              }
            ]
          }
        }),
      });
    });
    
    // Once generated, active plan GET should return the new plan
    // We can just rely on the UI updating state from the POST response, 
    // but in case it refetches:
    let generated = false;
    await page.route('**/api/study-plans/active', async (route, request) => {
      if (generated) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'mock-plan-1',
              status: 'active',
              dailyGoals: [
                {
                  date: '2026-08-15',
                  tasks: [
                    { title: 'Read Chapter 1', duration: 60, completed: false }
                  ]
                }
              ]
            }
          })
        });
      } else {
        generated = true; // next time it will return the plan
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: null
          })
        });
      }
    }, { times: 2 }); // First for initial load, second for refetch after generate
  });

  test('User can generate and view a Study Plan', async ({ page }) => {
    const studyPlanPage = new StudyPlanPage(page);
    await studyPlanPage.goto();
    
    // Open Study Plan modal
    await studyPlanPage.openStudyPlan();
    
    // Click Create Plan (which generates via AI mock)
    await studyPlanPage.createPlan();
    
    // Assert daily task is rendered (the modal transitions to the Gantt view or list view)
    // We look for 'Read Chapter 1'
    await expect(page.locator('text=Read Chapter 1')).toBeVisible();
  });
});

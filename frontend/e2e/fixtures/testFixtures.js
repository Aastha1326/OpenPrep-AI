import { test as base } from '@playwright/test';
import { AuthHelper } from '../helpers/authHelper';
import { setupApiMocks } from '../helpers/mockApi';

export const test = base.extend({
  auth: async ({ page }, use) => {
    const authHelper = new AuthHelper(page);
    await use(authHelper);
  },
  authenticatedPage: async ({ page }, use) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticatedSession();
    await setupApiMocks(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';

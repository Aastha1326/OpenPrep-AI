import { expect } from '@playwright/test';

export async function registerAndLoginViaApi(request, context) {
  const user = {
    name: 'E2E Test User',
    email: `e2e_${Date.now()}@example.com`,
    password: 'StrongPassword123!',
  };

  const response = await request.post('http://localhost:5000/api/auth/register', {
    data: user,
  });
  
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  
  // Set localStorage via context
  await context.addInitScript(({ token, refreshToken }) => {
    if (token) localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  }, { token: data.token, refreshToken: data.refreshToken });

  return { user, token: data.token };
}

export async function seedSubject(request, token, subjectName = 'E2E Subject') {
  const response = await request.post('http://localhost:5000/api/academic/subjects', {
    data: { name: subjectName, description: 'Test Subject' },
    headers: { Authorization: `Bearer ${token}` }
  });
  // Note: if the endpoint requires admin role, we might need a workaround or mock it.
  // Instead of real seed, we can just mock the /api/academic/subjects route in Playwright.
}

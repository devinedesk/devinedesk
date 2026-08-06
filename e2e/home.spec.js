const { test, expect } = require('@playwright/test');

test.describe('Platform E2E', () => {
  test('homepage has correct title and renders layout', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/devinedesk|Sign In/i);

    // If it redirects to login, we expect a login form
    if (page.url().includes('/auth/signin')) {
      await expect(page.locator('button', { hasText: 'Sign in' }).first()).toBeVisible();
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    // Clear cookies before each test
    await page.context().clearCookies();
  });

  test.skip('User can register successfully', async ({ page }) => {
    const testEmail = `testuser_${Date.now()}@example.com`;
    await page.goto('/auth/register');

    // Fill the registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'SecurePass123!');

    // Submit
    await page.click('button[type="submit"]');

    // Should be redirected to dashboard or verification
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('User can login successfully', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'admin_e2e@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');

    await page.click('button[type="submit"]');

    // Wait for network idle to ensure session is set
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Invalid credentials show error', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpass');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=No user found')).toBeVisible();
  });

});

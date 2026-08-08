const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test('should render the login page', async ({ page }) => {
    await page.goto('/auth/login');

    // Check if the login form elements are present
    await expect(page.locator('h1')).toContainText('Sign in');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should render the register page', async ({ page }) => {
    await page.goto('/auth/register');

    // Check if the register form elements are present
    await expect(page.locator('h1')).toContainText('Create an account');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

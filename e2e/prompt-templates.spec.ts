import { test, expect } from '@playwright/test';

test.describe('Prompt Template Library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore/templates');
  });

  test('should display the templates explorer', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Prompt Templates');
    await expect(page.locator('input[placeholder="Search templates..."]')).toBeVisible();
  });

  test('should open new template modal', async ({ page }) => {
    await page.click('button:has-text("New Template")');

    await expect(page.locator('h3:has-text("Create Prompt Template")')).toBeVisible();
    await expect(page.locator('input[placeholder="e.g. SEO Blog Post Generator"]')).toBeVisible();
  });

  test('should have filtering tabs', async ({ page }) => {
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("My Templates")')).toBeVisible();
    await expect(page.locator('button:has-text("Public")')).toBeVisible();
  });
});

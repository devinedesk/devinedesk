import { test, expect } from '@playwright/test';

test.describe('Support Ticketing System', () => {
  // Assuming a mocked auth setup or standard login is handled in playwright config global setup
  test.beforeEach(async ({ page }) => {
    // Navigate to the support dashboard
    await page.goto('/dashboard/support');
  });

  test('should display the help center dashboard', async ({ page }) => {
    await page.goto('/support');
    await expect(page.locator('h1')).toContainText('How can we help?');
    await expect(page.locator('text=Frequently Asked Questions')).toBeVisible();
  });

  test('should link to documentation', async ({ page }) => {
    await page.goto('/support');
    await expect(page.locator('h3:has-text("Documentation")')).toBeVisible();
  });

  test('should display admin support dashboard', async ({ page }) => {
    await page.goto('/admin/support');
    await expect(page.locator('h2:has-text("Support & Ticketing")').first()).toBeVisible();
    await expect(page.getByPlaceholder('Search tickets by ID, user, or subject...')).toBeVisible();
  });
});

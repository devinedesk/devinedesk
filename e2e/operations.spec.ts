import { test, expect } from '@playwright/test';

test.describe('Operations Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming auth is handled via a setup script or we can navigate directly if public/mocked
    await page.goto('/admin/operations');
  });

  test('should display system health metrics', async ({ page }) => {
    await expect(page.locator('h2:has-text("Operations")').first()).toBeVisible();

    // Check for key metric cards
    await expect(page.locator('text=API Uptime').first()).toBeVisible();
    await expect(page.locator('text=100%').first()).toBeVisible();

    await expect(page.locator('text=Avg Latency').first()).toBeVisible();
    await expect(page.locator('text=12ms').first()).toBeVisible();
    await expect(page.locator('text=Queue Backlog').first()).toBeVisible();
  });

  test('should display infrastructure nodes', async ({ page }) => {
    // Check for Database and Redis cards
    await expect(page.locator('h3:has-text("Database Cluster")').first()).toBeVisible();
    await expect(page.locator('h3:has-text("Redis Cache")').first()).toBeVisible();

    // Check for resource bars
    await expect(page.locator('text=CPU Usage').first()).toBeVisible();
    await expect(page.locator('text=Memory (RAM)').first()).toBeVisible();
    await expect(page.locator('text=Hit Rate').first()).toBeVisible();
  });
});

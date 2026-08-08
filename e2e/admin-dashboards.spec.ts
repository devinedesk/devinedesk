import { test, expect } from '@playwright/test';

test.describe('Admin Dashboards', () => {
  test.describe('Security Command Center', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/security');
    });

    test('should display active threats and audit logs', async ({ page }) => {
      await expect(page.locator('h2:has-text("Security Command Center")').first()).toBeVisible();

      // Posture cards
      await expect(page.locator('text=Active Threats').first()).toBeVisible();
      await expect(page.locator('text=Failed Logins').first()).toBeVisible();
      await expect(page.locator('text=2FA Adoption').first()).toBeVisible();
      await expect(page.locator('text=API Keys Issued').first()).toBeVisible();

      // Audit log table
      await expect(page.locator('text=Global Audit Log (Real-time)').first()).toBeVisible();
      await expect(page.locator('tbody').first()).toBeVisible();
    });
  });

  test.describe('System Health Metrics', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/health');
    });

    test('should display telemetry charts and node health', async ({ page }) => {
      await expect(page.locator('h2:has-text("System Health & Metrics")').first()).toBeVisible();

      // Node Status container
      await expect(page.locator('h3:has-text("Service Health")')).toBeVisible();
      await expect(page.locator('text=Primary DB')).toBeVisible();
    });
  });

  test.describe('Cost & Usage Analytics', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/usage');
    });

    test('should display usage metrics and top models', async ({ page }) => {
      await expect(page.locator('h2:has-text("Cost & Usage Analytics")').first()).toBeVisible();

      // Core metrics
      await expect(page.locator('text=Total AI Spend (All Time)').first()).toBeVisible();
      await expect(page.locator('text=Total Tokens (All Time)').first()).toBeVisible();
      await expect(page.locator('text=Avg Cost / Generation').first()).toBeVisible();
      await expect(page.locator('text=Total Purchase Volume').first()).toBeVisible();

      // Tables
      await expect(page.locator('h3:has-text("Cost by Model")').first()).toBeVisible();
      await expect(page.locator('h3:has-text("Top Users by Cost")').first()).toBeVisible();
    });
  });
});

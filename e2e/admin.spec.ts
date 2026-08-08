import { test, expect } from '@playwright/test';

test.describe('Admin RBAC Flows', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Non-admin users cannot access admin portal', async ({ page }) => {
    // Navigate to admin directly
    const response = await page.goto('/admin');

    // Expect redirect to login or 403 Forbidden depending on middleware implementation
    // By default, our NextAuth middleware redirects to /auth/login for unauthorized paths
    const url = page.url();
    expect(url.includes('/auth/login') || url.includes('/dashboard')).toBeTruthy();
  });

  // Admin access tests require seed data or mocked tokens which are typically handled
  // via globalSetup in Playwright for complex SaaS apps.
});

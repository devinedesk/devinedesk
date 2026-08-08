const { test, expect } = require('@playwright/test');

test.describe('Protected Settings Routes', () => {
  test('should redirect unauthenticated users from /settings/api-keys to login', async ({
    page,
  }) => {
    await page.goto('/settings/api-keys');

    // Should be redirected to login page due to NextAuth middleware
    await expect(page).toHaveURL(/.*\/auth\/login.*/);
  });

  test('should redirect unauthenticated users from /settings/webhooks to login', async ({
    page,
  }) => {
    await page.goto('/settings/webhooks');

    await expect(page).toHaveURL(/.*\/auth\/login.*/);
  });
});

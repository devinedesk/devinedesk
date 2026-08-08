const { test, expect } = require('@playwright/test');

test.describe('Visual Workflow Builder E2E', () => {
  // Use a fixed session or mock authentication before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('/auth/login');
    // For a real E2E, we would fill in the login form or set a mock cookie.
    // Assuming the user is logged in for these tests.
  });

  test('should load the workflow studio', async ({ page }) => {
    // Navigate to the studio
    await page.goto('/studio/new');

    // Verify the canvas is visible
    await expect(page.locator('.react-flow')).toBeVisible();

    // Verify the toolbar is present
    await expect(page.getByRole('button', { name: /add node/i })).toBeVisible();
  });

  test('should allow adding a new LLM node to the canvas', async ({ page }) => {
    await page.goto('/studio/new');
    
    // Click Add Node
    await page.getByRole('button', { name: /add node/i }).click();
    
    // Select LLM Node
    await page.getByText('LLM Generation').click();

    // Verify node appeared on canvas
    const node = page.locator('.react-flow__node').filter({ hasText: 'LLM Generation' });
    await expect(node).toBeVisible();
  });

  test('should open settings panel when node is clicked', async ({ page }) => {
    await page.goto('/studio/new');
    
    // Add Node
    await page.getByRole('button', { name: /add node/i }).click();
    await page.getByText('LLM Generation').click();

    // Click the Node
    await page.locator('.react-flow__node').filter({ hasText: 'LLM Generation' }).click();

    // Verify Settings Panel slides in
    await expect(page.getByText('Node Configuration')).toBeVisible();
  });
});

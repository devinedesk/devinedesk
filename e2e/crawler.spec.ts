import { test, expect } from '@playwright/test';

const TABS = [
  'image', 'video', 'audio', 'clipping', 'vibe-motion', 'lipsync', 'body-swap',
  'cinema', 'marketing', 'workflows', 'agents', 'design-agent', 'apps', 'ai-influencer'
];

test.describe('devinedesk Crawler', () => {
  test.beforeAll(async ({ browser }) => {
    // Pre-compile the studio page sequentially so the Next.js dev server
    // doesn't drop concurrent sockets (net::ERR_ABORTED) when the tests blast it in parallel.
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/studio/image', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.close();
  });
  test.beforeEach(async ({ page }) => {
    await page.route('**/{api,agents,workflow}/**', async route => {
      const url = route.request().url();
      if (url.includes('/api/auth/session')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { name: "Test User", email: "test@example.com", image: null },
            expires: "2100-01-01T00:00:00.000Z"
          })
        });
      } else if (url.includes('/api/auth/')) {
        return route.continue();
      }
      await route.fulfill({ status: 200, json: { balance: 100, success: true, data: [] } });
    });
    // Navigate to a blank page on the domain to set localStorage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('platform_api_key', 'test_key');
      localStorage.setItem('vadoo_banner_dismissed', '1');
    });
  });

  for (const tab of TABS) {
    test(`Visit ${tab} studio`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto(`/studio/${tab}`);
      
      // Wait for network idle or timeout
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      
      // Basic check to ensure the page loaded and didn't hit a fatal Next.js error
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('Application error: a client-side exception has occurred');
      
      // Output errors for diagnostics
      if (errors.length > 0) {
        console.log(`[${tab}] Console Errors:`, errors);
      }
    });
  }
});

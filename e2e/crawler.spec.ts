import { test, expect } from '@playwright/test';

const TABS = [
  'image', 'video', 'audio', 'clipping', 'vibe-motion', 'lipsync', 'body-swap',
  'cinema', 'marketing', 'workflows', 'agents', 'design-agent', 'apps', 'ai-influencer'
];

test.describe('devinedesk Crawler', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a blank page on the domain to set localStorage
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('muapi_key', 'test_key');
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

      await page.goto(`http://localhost:3000/studio/${tab}`);
      
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

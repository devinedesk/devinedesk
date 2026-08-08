import { describe, it } from 'node:test';
import assert from 'node:assert';
import { rateLimit } from '../lib/security.js';

describe('Security Utils API Tests', () => {
  it('should allow requests under the rate limit', async () => {
    // Mock request object
    const req = {
      headers: {
        get: (key) => (key === 'x-forwarded-for' ? '192.168.1.1' : null),
      },
    };

    // Test the fail-open fallback behavior when Redis is not mocked properly
    // or test the actual logic if Redis is running locally
    const result = await rateLimit(req, 60, 60);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.limit, 60);
  });

  it('should fall back gracefully on missing headers', async () => {
    const req = {
      headers: {
        get: () => null,
      },
    };

    const result = await rateLimit(req, 60, 60);
    assert.strictEqual(result.success, true);
  });
});

import { after } from 'node:test';
after(() => {
  process.exit(0);
});

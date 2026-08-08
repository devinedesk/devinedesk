import { describe, it, expect, vi } from 'vitest';
import { checkRateLimit } from '@/src/lib/rateLimit';
import { withApiAuth } from '@/src/lib/apiHandler';

// Mock Redis for rate limiting
vi.mock('@/src/lib/redis', () => ({
  redis: {
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  }
}));

describe('API Integration & Middleware', () => {
  describe('Rate Limiting', () => {
    it('should allow requests under the limit', async () => {
      const result = await checkRateLimit('test_ip', 'FREE');
      expect(result.success).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });
  });

  describe('withApiAuth Middleware', () => {
    it('should reject unauthorized requests', async () => {
      const handler = withApiAuth({
        handler: async () => new Response('OK', { status: 200 })
      });

      // Mock request without auth headers
      const req = {
        headers: {
          get: () => null
        }
      };

      const res = await handler(req, { params: {} });
      expect(res.status).toBe(401);
      
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });
  });
});

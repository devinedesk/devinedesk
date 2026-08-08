import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from './logger';

// Only initialize if UPSTASH env vars are provided
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  logger.warn('UPSTASH_REDIS_REST_URL is missing. Rate limiting will be bypassed.');
}

// Define tiered limits
// Free: 10 req / 10s
// Pro: 100 req / 10s
// Enterprise: 1000 req / 10s
const getTieredLimit = (tier) => {
  if (!redis) return null;

  switch (tier?.toUpperCase()) {
    case 'ENTERPRISE':
      return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1000, '10 s') });
    case 'PRO':
      return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '10 s') });
    default:
      return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '10 s') });
  }
};

/**
 * Checks the rate limit for a given identifier (IP, userId, or API Key).
 * @param {string} identifier - unique string to bucket the rate limit (e.g. "ip_127.0.0.1")
 * @param {string} tier - 'FREE', 'PRO', or 'ENTERPRISE'
 * @returns {Promise<{success: boolean, limit: number, remaining: number, reset: number}>}
 */
export async function checkRateLimit(identifier, tier = 'FREE') {
  if (!redis) {
    // Fail open if Redis is not configured (e.g. local dev)
    return { success: true, limit: 9999, remaining: 9999, reset: Date.now() + 10000 };
  }

  try {
    const ratelimit = getTieredLimit(tier);
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

    if (!success) {
      logger.warn({ identifier, tier }, 'Rate limit exceeded');
    }

    return { success, limit, remaining, reset };
  } catch (error) {
    // If Redis fails, log it and fail open to not block production traffic completely
    logger.error({ err: error, identifier }, 'Rate limiter failed');
    return { success: true, limit: 9999, remaining: 9999, reset: Date.now() + 10000 };
  }
}

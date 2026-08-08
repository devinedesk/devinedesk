import IORedis from 'ioredis';
import { env } from '@/src/lib/env';

// Initialize Redis only if we're not in the browser
const redisUrl = env.REDIS_URL || 'redis://localhost:6379';
const redis =
  typeof window === 'undefined' ? new IORedis(redisUrl, { maxRetriesPerRequest: null }) : null;

export class RateLimitService {
  /**
   * Checks if a request should be rate-limited using a sliding window log approach.
   *
   * @param {string} identifier - IP address or User ID.
   * @param {number} limit - Maximum requests allowed in the window.
   * @param {number} windowSeconds - Time window in seconds.
   * @returns {Promise<boolean>} True if rate limited, false otherwise.
   */
  static async isRateLimited(identifier, limit = 60, windowSeconds = 60) {
    if (!redis) return false;

    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    try {
      // Use a Redis pipeline for atomic execution
      const pipeline = redis.pipeline();

      // Remove requests older than the window
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count requests in the current window
      pipeline.zcard(key);

      // Add the current request
      pipeline.zadd(key, now, `${now}-${Math.random().toString(36).substring(2, 9)}`);

      // Set expiry on the key to clean it up automatically
      pipeline.expire(key, windowSeconds);

      const results = await pipeline.exec();

      // results[1] is the output of zcard (count of requests in window BEFORE adding the new one)
      const currentCount = results[1][1];

      return currentCount >= limit;
    } catch (error) {
      console.error('[RateLimitService Error]:', error);
      // Fail open to prevent blocking legitimate traffic on Redis failure
      return false;
    }
  }
}

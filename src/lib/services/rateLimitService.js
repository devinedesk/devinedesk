import IORedis from 'ioredis';
import { env } from '@/src/lib/env';

// Initialize Redis only if we're not in the browser
const redisUrl = env.REDIS_URL || 'redis://localhost:6379';
const redis = typeof window === 'undefined' ? new IORedis(redisUrl, { maxRetriesPerRequest: null }) : null;

export class RateLimitService {
    /**
     * Checks if a request should be rate-limited.
     * Uses a rolling window approach in Redis.
     * 
     * @param {string} identifier - IP address or User ID.
     * @param {number} limit - Maximum requests allowed.
     * @param {number} windowSeconds - Time window in seconds.
     * @returns {Promise<boolean>} True if rate limited, false otherwise.
     */
    static async isRateLimited(identifier, limit = 60, windowSeconds = 60) {
        if (!redis) return false;

        const key = `rate_limit:${identifier}`;
        const currentCount = await redis.incr(key);

        if (currentCount === 1) {
            await redis.expire(key, windowSeconds);
        }

        return currentCount > limit;
    }
}

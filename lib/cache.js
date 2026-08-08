import Redis from 'ioredis';
import { logger } from './logger';

// Shared Redis client
let redisClient = null;

export function getRedis() {
  if (!redisClient) {
    try {
      redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      redisClient.on('error', (err) => {
        logger.error('Redis Connection Error', err);
      });
    } catch (e) {
      logger.error('Failed to initialize Redis', e);
    }
  }
  return redisClient;
}

export async function fetchWithCache(key, fetcher, ttlSeconds = 300) {
  const redis = getRedis();

  if (!redis) {
    logger.warn(`Redis unavailable, bypassing cache for key: ${key}`);
    return fetcher();
  }

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const freshData = await fetcher();

    // Only cache non-null/undefined data
    if (freshData !== null && freshData !== undefined) {
      await redis.setex(key, ttlSeconds, JSON.stringify(freshData));
    }

    return freshData;
  } catch (error) {
    logger.error(`Cache error for key ${key}`, error);
    // Fallback to fetching fresh data if cache operation fails
    return fetcher();
  }
}

export async function invalidateCache(pattern) {
  const redis = getRedis();
  if (!redis) return;

  try {
    // Note: KEYS is dangerous in production on large datasets.
    // Consider using SCAN or deleting specific known keys instead.
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Invalidated ${keys.length} cache keys matching ${pattern}`);
    }
  } catch (error) {
    logger.error(`Failed to invalidate cache for pattern ${pattern}`, error);
  }
}

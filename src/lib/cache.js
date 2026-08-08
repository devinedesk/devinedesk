import Redis from 'ioredis';
import { logger } from './logger';

let redisClient = null;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  redisClient.on('error', (err) => {
    logger.warn({ err }, 'Redis cache connection error (fail open)');
  });
}

/**
 * Gets a cached value or fetches and caches it if missing.
 * @param {string} key - Cache key
 * @param {function} fetchFn - Async function returning data
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<any>}
 */
export async function getCached(key, fetchFn, ttlSeconds = 60) {
  if (!redisClient) {
    logger.debug('Redis not configured, bypassing cache');
    return fetchFn();
  }

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn({ err, key }, 'Failed to get from cache');
  }

  const data = await fetchFn();

  try {
    if (data !== undefined && data !== null) {
      await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    }
  } catch (err) {
    logger.warn({ err, key }, 'Failed to set to cache');
  }

  return data;
}

export async function invalidateCache(keyPattern) {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(keyPattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (err) {
    logger.warn({ err, keyPattern }, 'Failed to invalidate cache');
  }
}

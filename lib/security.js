import Redis from 'ioredis';

// Reuse the existing Redis connection if possible, or create a new one
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export async function rateLimit(request, limit = 60, windowInSeconds = 60, identifier = null) {
  try {
    let keyStr;

    if (identifier) {
      keyStr = identifier;
    } else {
      // Basic IP extraction for Next.js App Router
      const ip =
        request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';

      // Fallback if not an IP
      keyStr = ip.split(',')[0].trim();
    }

    const key = `rate_limit:${keyStr}`;

    const requests = await redis.incr(key);

    if (requests === 1) {
      await redis.expire(key, windowInSeconds);
    }

    return {
      success: requests <= limit,
      limit,
      remaining: Math.max(0, limit - requests),
      reset: Math.floor(Date.now() / 1000) + windowInSeconds,
    };
  } catch (error) {
    console.warn('Redis rate limiter failed, allowing request by default', error);
    // If Redis fails, fail open to prevent blocking legitimate traffic during outages
    return { success: true, limit, remaining: limit, reset: 0 };
  }
}

export function sanitizeHtml(input) {
  if (!input) return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import env from '@/src/lib/env';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'down', latency: 0 },
      redis: { status: 'down', latency: 0 },
      api: { status: 'up', latency: 0 },
    },
  };

  const startApi = performance.now();
  health.services.api.latency = Math.round(performance.now() - startApi);

  // Check Database
  try {
    const startDb = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    health.services.database.latency = Math.round(performance.now() - startDb);
    health.services.database.status = 'up';
  } catch (error) {
    console.error('Health Check DB Error:', error);
    health.status = 'degraded';
    health.services.database.status = 'down';
  }

  // Check Redis
  let redisClient = null;
  try {
    const startRedis = performance.now();
    // Using lazyConnect so we can manually connect, ping, and disconnect just for the check
    redisClient = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
    await redisClient.connect();
    await redisClient.ping();
    health.services.redis.latency = Math.round(performance.now() - startRedis);
    health.services.redis.status = 'up';
  } catch (error) {
    console.error('Health Check Redis Error:', error);
    health.status = 'degraded';
    health.services.redis.status = 'down';
  } finally {
    if (redisClient) {
      redisClient.disconnect();
    }
  }

  if (health.services.database.status === 'down' && health.services.redis.status === 'down') {
    health.status = 'major_outage';
  }

  return NextResponse.json(health, {
    status: health.status === 'operational' ? 200 : 503,
  });
}

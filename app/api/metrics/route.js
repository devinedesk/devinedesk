import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import client from 'prom-client';

// Initialize the default metrics registry
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Define custom metrics
const queueDepthGauge = new client.Gauge({
  name: 'devinedesk_bullmq_queue_depth',
  help: 'Number of jobs waiting in the primary background queue',
});

const activeSessionsGauge = new client.Gauge({
  name: 'devinedesk_active_sessions_total',
  help: 'Total number of active JWT sessions tracked in memory',
});

register.registerMetric(queueDepthGauge);
register.registerMetric(activeSessionsGauge);

export const GET = withApiAuth({
  requireAdmin: true,
  handler: async () => {
    try {
      const { generateQueue } = await import('@/src/lib/queue');
      const queueCounts = await generateQueue.getJobCounts();
      queueDepthGauge.set(queueCounts.waiting || 0);

      // Total number of users minus some offset
      const { default: prisma } = await import('@/src/lib/prisma');
      const userCount = await prisma.user.count();
      activeSessionsGauge.set(userCount);

      const metrics = await register.metrics();

      return new NextResponse(metrics, {
        status: 200,
        headers: {
          'Content-Type': register.contentType,
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

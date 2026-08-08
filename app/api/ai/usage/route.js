import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { subDays } from 'date-fns';
import { withApiAuth } from '@/src/lib/apiHandler';

export const GET = withApiAuth({
  handler: async (req, { auth }) => {
    try {
      const { searchParams } = new URL(req.url);
      const days = parseInt(searchParams.get('days') || '30', 10);
      const startDate = subDays(new Date(), days);

      // Group by Date
      const usageData = await prisma.modelUsage.groupBy({
        by: ['model'],
        where: {
          userId: auth.user.id,
          createdAt: {
            gte: startDate,
          },
        },
        _sum: {
          totalTokens: true,
          costInCents: true,
        },
      });

      // Also fetch the last 100 usage logs
      const recentLogs = await prisma.modelUsage.findMany({
        where: { userId: auth.user.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return NextResponse.json({
        summary: usageData,
        logs: recentLogs,
      });
    } catch (error) {
      console.error('[USAGE_GET]', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },
});

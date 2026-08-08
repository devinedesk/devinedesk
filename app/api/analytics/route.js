import { getCached } from '@/src/lib/cache';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';

export const GET = withApiAuth({
  handler: async (request, { auth }) => {
    try {
      const { searchParams } = new URL(request.url);
      const days = parseInt(searchParams.get('days') || '30', 10);
      const cacheKey = `analytics:${auth.user.id}:${days}`;

      const analyticsData = await getCached(
        cacheKey,
        async () => {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);

          // 1. Fetch top-level stats
          const [totalRequests, successfulRequests, transactions] = await Promise.all([
            prisma.generation.count({
              where: { userId: auth.user.id, createdAt: { gte: startDate } },
            }),
            prisma.generation.count({
              where: { userId: auth.user.id, status: 'completed', createdAt: { gte: startDate } },
            }),
            prisma.transaction.findMany({
              where: { userId: auth.user.id, type: 'usage', createdAt: { gte: startDate } },
            }),
          ]);

          const successRate =
            totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(1) : 0;
          const totalCost = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

          // 2. Aggregate data for Line Chart (Requests Over Time)
          const generations = await prisma.generation.findMany({
            where: { userId: auth.user.id, createdAt: { gte: startDate } },
            select: { createdAt: true, type: true },
          });

          const timelineMap = {};
          const modelUsageMap = {};

          generations.forEach((gen) => {
            // Group by Date (YYYY-MM-DD)
            const dateKey = gen.createdAt.toISOString().split('T')[0];
            if (!timelineMap[dateKey]) {
              timelineMap[dateKey] = { date: dateKey, total: 0, image: 0, video: 0, other: 0 };
            }
            timelineMap[dateKey].total += 1;

            if (gen.type.includes('image') || gen.type === 't2i') timelineMap[dateKey].image += 1;
            else if (gen.type.includes('video')) timelineMap[dateKey].video += 1;
            else timelineMap[dateKey].other += 1;

            // Group by Model/Type
            const modelKey = gen.type || 'unknown';
            modelUsageMap[modelKey] = (modelUsageMap[modelKey] || 0) + 1;
          });

          // Convert to arrays for Recharts
          const timelineData = Object.values(timelineMap).sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );

          // Generate empty days to fill gaps
          const fullTimeline = [];
          for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i + 1);
            const dateKey = d.toISOString().split('T')[0];
            const existing = timelineData.find((item) => item.date === dateKey);
            fullTimeline.push(
              existing || { date: dateKey, total: 0, image: 0, video: 0, other: 0 }
            );
          }

          // Format for Pie Chart
          const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];
          const modelData = Object.entries(modelUsageMap).map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length],
          }));

          // If completely empty, provide fallback data for the pie chart
          if (modelData.length === 0) {
            modelData.push({ name: 'No Usage', value: 1, color: '#333' });
          }

          return {
            stats: {
              totalRequests,
              successRate: `${successRate}%`,
              apiCost: `${totalCost} credits`,
            },
            charts: {
              timeline: fullTimeline,
              modelUsage: modelData,
            },
          };
        },
        300
      ); // 5 minute TTL

      return NextResponse.json(analyticsData, { status: 200 });
    } catch (error) {
      console.error('Fetch Analytics Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

import { getCached } from '@/src/lib/cache';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';

export const GET = withApiAuth({
  requireAuth: false,
  handler: async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type') || 'workflows'; // 'workflows' or 'agents'
      const limit = parseInt(searchParams.get('limit')) || 20;
      const cacheKey = `explore:${type}:${limit}`;

      const results = await getCached(
        cacheKey,
        async () => {
          if (type === 'workflows') {
            return prisma.workflow.findMany({
              where: { isPublic: true },
              orderBy: { createdAt: 'desc' },
              take: limit,
              include: {
                user: {
                  select: { name: true, image: true },
                },
              },
            });
          } else if (type === 'agents') {
            return prisma.agent.findMany({
              where: { isPublic: true },
              orderBy: { createdAt: 'desc' },
              take: limit,
              include: {
                user: {
                  select: { name: true, image: true },
                },
              },
            });
          }
          return null;
        },
        120
      ); // 120 seconds TTL

      if (!results) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }

      return NextResponse.json(results, { status: 200 });
    } catch (error) {
      console.error('Explore API GET Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

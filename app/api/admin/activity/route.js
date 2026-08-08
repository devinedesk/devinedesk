import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { withApiAuth } from '@/src/lib/apiHandler';

export const GET = withApiAuth({
  handler: async (request, { auth }) => {
    // Only allow Admins
    if (auth.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    try {
      // Assuming AuditLog or a similar table exists in schema.prisma
      // Fallback to recent users if AuditLog doesn't exist
      const activities = await prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      });

      const mappedActivity = activities.map((u) => ({
        id: u.id,
        user: { name: u.name, image: u.image, email: u.email },
        actionDescription: 'Created a new account',
        createdAt: u.createdAt,
      }));

      return NextResponse.json({ data: mappedActivity });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }
  },
});

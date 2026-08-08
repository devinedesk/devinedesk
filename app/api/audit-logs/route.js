import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';

export const GET = withApiAuth({
  handler: async (request, { auth }) => {
    try {
      const userId = auth.user.id;

      // Fetch audit logs related to organizations the user is a part of
      const userOrgs = await prisma.organizationMember.findMany({
        where: { userId },
        select: { organizationId: true },
      });

      const orgIds = userOrgs.map((org) => org.organizationId);

      const logs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { organizationId: { in: orgIds } },
            { userId: userId }, // Include their own direct actions
          ],
        },
        include: {
          user: { select: { name: true, email: true } },
          organization: { select: { name: true } },
          workspace: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return NextResponse.json({ logs });
    } catch (error) {
      console.error('Audit Logs Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { withApiAuth } from '@/src/lib/apiHandler';

export const GET = withApiAuth({
  handler: async (req, { auth }) => {
    try {
      const userId = auth.user.id;

      // Fetch all user data concurrently
      const [user, generations, transactions, auditLogs, apiKeys, workspaces] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, name: true, createdAt: true, credits: true, role: true },
        }),
        prisma.generation.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.transaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.aPIKey.findMany({
          where: { userId },
          select: { id: true, name: true, lastUsedAt: true, createdAt: true }, // Omit actual key
        }),
        prisma.workspaceMember.findMany({
          where: { userId },
          include: { workspace: { select: { id: true, name: true, slug: true } } },
        }),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user,
        workspaces: workspaces.map((w) => ({ ...w.workspace, role: w.role })),
        apiKeys,
        transactions,
        generations,
        auditLogs,
      };

      // Return as a downloadable JSON file
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="devinedesk_export_${new Date().getTime()}.json"`,
        },
      });
    } catch (error) {
      console.error('GDPR Export Error:', error);
      return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
  },
});

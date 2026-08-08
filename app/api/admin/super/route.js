import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { withApiAuth } from '@/src/lib/apiHandler';

export const GET = withApiAuth({
  requireAdmin: true,
  handler: async (req, { auth }) => {
    try {
      // Check if user is exactly Super Admin
      if (auth.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Requires Super Admin' }, { status: 403 });
      }

      // Fetch Admin Data
      const [userCount, activeGenerations, workspaceCount] = await Promise.all([
        prisma.user.count(),
        prisma.generation.count({ where: { status: 'PROCESSING' } }),
        prisma.workspace.count(),
      ]);

      return NextResponse.json({
        stats: {
          totalUsers: userCount,
          activeGenerations,
          totalWorkspaces: workspaceCount,
          systemStatus: 'Healthy',
        },
      });
    } catch (error) {
      console.error('Super Admin API Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

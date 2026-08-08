import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { withApiAuth } from '@/src/lib/apiHandler';

export const GET = withApiAuth({
  handler: async (req, { auth, params }) => {
    try {
      const { id: runId } = await params;

      // Fetch WorkflowRun
      const run = await prisma.workflowRun.findUnique({
        where: { id: runId },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
              userId: true,
            },
          },
        },
      });

      if (!run || run.userId !== auth.user.id) {
        return NextResponse.json({ error: 'Run not found or access denied' }, { status: 404 });
      }

      // Return Status and Outputs
      return NextResponse.json(
        {
          runId: run.id,
          workflowId: run.workflowId,
          status: run.status, // PROCESSING, COMPLETED, FAILED
          outputs: run.outputs ? JSON.parse(run.outputs) : null,
          error: run.error,
          createdAt: run.createdAt,
          updatedAt: run.updatedAt,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Public API Run Polling Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { withApiAuth } from '@/src/lib/apiHandler';
import { z } from 'zod';

// GET /api/workflows/[id]/runs
export const GET = withApiAuth({
  handler: async (req, { auth, params }) => {
    try {
      const { id: workflowId } = await params;
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const page = parseInt(searchParams.get('page') || '1');
      const skip = (page - 1) * limit;

      // Verify workflow exists and belongs to user (or is public)
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }

      if (workflow.userId !== auth.user.id && !workflow.isPublic) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const runs = await prisma.workflowRun.findMany({
        where: {
          workflowId,
          userId: auth.user.id, // Only show runs executed by this user
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      });

      const total = await prisma.workflowRun.count({
        where: {
          workflowId,
          userId: auth.user.id,
        },
      });

      return NextResponse.json({
        runs,
        metadata: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching workflow runs:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

const executeRunSchema = z.object({
  inputs: z.record(z.any()).optional().default({}),
});

// POST /api/workflows/[id]/runs
export const POST = withApiAuth({
  schema: executeRunSchema,
  handler: async (req, { auth, body, params }) => {
    try {
      const { id: workflowId } = await params;

      // Verify workflow exists and belongs to user (or is public)
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }

      if (workflow.userId !== auth.user.id && !workflow.isPublic) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Execute the workflow via WorkflowService to handle parsing, billing, and queueing
      const { WorkflowService } = await import('@/src/lib/services/workflowService');
      const result = await WorkflowService.queueWorkflowRun(
        workflowId,
        auth.user.id,
        body.inputs || {}
      );

      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      console.error('Error creating workflow run:', error);
      if (error.message && error.message.includes('Insufficient credits')) {
        return NextResponse.json({ error: error.message }, { status: 402 });
      }
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

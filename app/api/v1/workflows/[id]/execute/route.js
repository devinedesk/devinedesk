import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { QueueService } from '@/src/lib/queue';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { withApiAuth } from '@/src/lib/apiHandler';
import { executeWorkflowSchema } from '@/src/lib/openapi-registry';


export const POST = withApiAuth({
  schema: executeWorkflowSchema,
  handler: async (req, { auth, body, params }) => {
    try {
      const { id: workflowId } = await params;
      const { inputs } = body;

      // Verify workflow ownership
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow || workflow.userId !== auth.user.id) {
        return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
      }

      // Create WorkflowRun record immediately
      const runId = randomUUID();
      await prisma.workflowRun.create({
        data: {
          id: runId,
          workflowId: workflowId,
          userId: auth.user.id,
          status: 'PROCESSING',
        },
      });

      // Push to Queue
      await QueueService.addWorkflowJob({
        runId,
        workflowId,
        workflow, // Pass the full workflow object
        userId: auth.user.id,
        inputs,
      });

      return NextResponse.json(
        {
          runId,
          status: 'queued',
          message: 'Workflow queued successfully. Result will be dispatched via webhooks.',
        },
        { status: 202 }
      );
    } catch (error) {
      console.error('Public API Workflow Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

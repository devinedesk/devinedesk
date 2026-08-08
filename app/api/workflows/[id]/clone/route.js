import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { withApiAuth } from '@/src/lib/apiHandler';

export const POST = withApiAuth({
  handler: async (req, { auth, params }) => {
    try {
      const { id: workflowId } = await params;

      // Fetch the original workflow
      const originalWorkflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!originalWorkflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }

      if (!originalWorkflow.isPublic && originalWorkflow.userId !== auth.user.id) {
        return NextResponse.json(
          { error: 'This workflow is private and cannot be cloned.' },
          { status: 403 }
        );
      }

      // Clone it
      const clonedWorkflow = await prisma.workflow.create({
        data: {
          userId: auth.user.id,
          name: `${originalWorkflow.name} (Clone)`,
          description: originalWorkflow.description,
          nodes: originalWorkflow.nodes,
          edges: originalWorkflow.edges,
          viewport: originalWorkflow.viewport,
          isPublic: false,
          clonedFromId: originalWorkflow.id,
        },
      });

      // Log the event
      await prisma.auditLog.create({
        data: {
          action: 'WORKFLOW_CLONED',
          resource: 'Workflow',
          resourceId: clonedWorkflow.id,
          userId: auth.user.id,
          metadata: JSON.stringify({ originalId: originalWorkflow.id }),
        },
      });

      return NextResponse.json(clonedWorkflow, { status: 201 });
    } catch (error) {
      console.error('Workflow Clone API POST Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

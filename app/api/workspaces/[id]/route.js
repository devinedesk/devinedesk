import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';
import { withApiAuth } from '@/src/lib/apiHandler';

const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const PUT = withApiAuth({
  schema: updateWorkspaceSchema,
  handler: async (req, { auth, body, params }) => {
    try {
      const { id } = await params;
      const { name } = body;

      // Verify user is ADMIN of the workspace
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: id,
            userId: auth.user.id,
          },
        },
      });

      if (!membership || membership.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updatedWs = await prisma.workspace.update({
        where: { id },
        data: { name },
      });

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE_WORKSPACE',
          resource: 'Workspace',
          resourceId: id,
          userId: auth.user.id,
          workspaceId: id,
          metadata: JSON.stringify({ name }),
        },
      });

      return NextResponse.json({ workspace: updatedWs });
    } catch (error) {
      console.error('Update Workspace Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

export const DELETE = withApiAuth({
  handler: async (req, { auth, params }) => {
    try {
      const { id } = await params;

      // Verify user is ADMIN of the workspace
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: id,
            userId: auth.user.id,
          },
        },
      });

      if (!membership || membership.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Only admins can delete.' }, { status: 403 });
      }

      await prisma.workspace.update({
        where: { id },
        data: { deletedAt: new Date() }, // soft-delete
      });

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          action: 'DELETE_WORKSPACE',
          resource: 'Workspace',
          resourceId: id,
          userId: auth.user.id,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete Workspace Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

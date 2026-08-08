import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';

const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  organizationId: z.string().min(1, 'Organization ID is required'),
});

export const GET = withApiAuth({
  handler: async (request, { auth }) => {
    try {
      const userId = auth.user.id;

      const workspaces = await prisma.workspace.findMany({
        where: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
        include: {
          organization: {
            select: { name: true, slug: true },
          },
          members: {
            select: { role: true, userId: true, user: { select: { name: true, image: true } } },
          },
        },
      });

      return NextResponse.json({ workspaces });
    } catch (error) {
      console.error('Fetch Workspaces Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

export const POST = withApiAuth({
  schema: createWorkspaceSchema,
  handler: async (request, { auth, body }) => {
    try {
      const userId = auth.user.id;
      const { name, organizationId } = body;

      // Verify user is a member of the organization
      const orgMembership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: organizationId,
            userId: userId,
          },
        },
      });

      if (!orgMembership || (orgMembership.role !== 'OWNER' && orgMembership.role !== 'ADMIN')) {
        return NextResponse.json(
          { error: 'You do not have permission to create workspaces in this organization.' },
          { status: 403 }
        );
      }

      const slug = `ws_${Math.random().toString(36).substring(2, 9)}`;

      const newWorkspace = await prisma.workspace.create({
        data: {
          name,
          slug,
          organizationId,
          members: {
            create: {
              userId: userId,
              role: 'ADMIN', // Default workspace creator to ADMIN
            },
          },
        },
        include: {
          organization: { select: { name: true } },
          members: { select: { role: true, userId: true } },
        },
      });

      return NextResponse.json({ workspace: newWorkspace });
    } catch (error) {
      console.error('Create Workspace Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

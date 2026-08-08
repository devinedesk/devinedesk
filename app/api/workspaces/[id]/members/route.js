import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';
import { withApiAuth } from '@/src/lib/apiHandler';

// GET /api/workspaces/[id]/members
export const GET = withApiAuth({
  handler: async (req, { auth, params }) => {
    try {
      const { id: workspaceId } = await params;

      // Verify user is part of the workspace (or organization admin)
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: auth.user.id,
          },
        },
      });

      if (!membership) {
        // Check if they are an org admin instead
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { organizationId: true },
        });

        if (!workspace) {
          return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        const orgMember = await prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: workspace.organizationId,
              userId: auth.user.id,
            },
          },
        });

        if (!orgMember || !['OWNER', 'ADMIN'].includes(orgMember.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json(members);
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

const addWorkspaceMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER', 'GUEST']),
});

// POST /api/workspaces/[id]/members
export const POST = withApiAuth({
  schema: addWorkspaceMemberSchema,
  handler: async (req, { auth, body, params }) => {
    try {
      const { id: workspaceId } = await params;
      const { email, role } = body;

      // Must be a workspace ADMIN/MANAGER or an org OWNER/ADMIN
      const currentMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: auth.user.id,
          },
        },
      });

      const isWorkspaceAdmin = currentMember && ['ADMIN', 'MANAGER'].includes(currentMember.role);

      let isOrgAdmin = false;
      if (!isWorkspaceAdmin) {
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
        });
        if (workspace) {
          const orgMember = await prisma.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId: workspace.organizationId,
                userId: auth.user.id,
              },
            },
          });
          isOrgAdmin = orgMember && ['OWNER', 'ADMIN'].includes(orgMember.role);
        }
      }

      if (!isWorkspaceAdmin && !isOrgAdmin) {
        return NextResponse.json({ error: 'Forbidden - Requires Admin role' }, { status: 403 });
      }

      // Find the user by email
      const userToAdd = await prisma.user.findUnique({
        where: { email },
      });

      if (!userToAdd) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if already a member
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: userToAdd.id,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
      }

      // Add member
      const newMember = await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: userToAdd.id,
          role: role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(newMember, { status: 201 });
    } catch (error) {
      console.error('Error adding workspace member:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

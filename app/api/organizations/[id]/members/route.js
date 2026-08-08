import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';
import { withApiAuth } from '@/src/lib/apiHandler';

// GET /api/organizations/[id]/members
export const GET = withApiAuth({
  handler: async (req, { auth, params }) => {
    try {
      const { id: organizationId } = await params;

      // Verify user is part of the organization
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: auth.user.id,
          },
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const members = await prisma.organizationMember.findMany({
        where: { organizationId },
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
      console.error('Error fetching organization members:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER', 'GUEST']),
});

// POST /api/organizations/[id]/members
export const POST = withApiAuth({
  schema: addMemberSchema,
  handler: async (req, { auth, body, params }) => {
    try {
      const { id: organizationId } = await params;
      const { email, role } = body;

      // Verify current user has admin rights
      const currentMember = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: auth.user.id,
          },
        },
      });

      if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
        return NextResponse.json({ error: 'Forbidden - Requires Admin role' }, { status: 403 });
      }

      // Find the user by email
      const userToAdd = await prisma.user.findUnique({
        where: { email },
      });

      if (!userToAdd) {
        // In a real app, you would send an invite email here instead of failing
        const { EmailService } = await import('@/src/lib/services/emailService');
        const org = await prisma.organization.findUnique({ where: { id: organizationId } });
        const inviteLink = `${process.env.NEXTAUTH_URL}/auth/register?org=${organizationId}&email=${encodeURIComponent(email)}`;

        await EmailService.sendOrganizationInvite(
          email,
          auth.user.name,
          org?.name || 'an organization',
          inviteLink
        );

        return NextResponse.json({ message: 'User not found. Invite email sent.' }, { status: 200 });
      }

      // Check if already a member
      const existingMember = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: userToAdd.id,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
      }

      // Add member
      const newMember = await prisma.organizationMember.create({
        data: {
          organizationId,
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
      console.error('Error adding organization member:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

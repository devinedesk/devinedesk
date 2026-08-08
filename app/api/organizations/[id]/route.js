import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';
import { withApiAuth } from '@/src/lib/apiHandler';

const updateOrgSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const PUT = withApiAuth({
  schema: updateOrgSchema,
  handler: async (req, { auth, body, params }) => {
    try {
      const { id } = await params; // Next.js 15 requires awaiting params
      const { name } = body;

      // Verify user is OWNER or ADMIN
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: id,
            userId: auth.user.id,
          },
        },
      });

      if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updatedOrg = await prisma.organization.update({
        where: { id },
        data: { name },
      });

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE_ORGANIZATION',
          resource: 'Organization',
          resourceId: id,
          userId: auth.user.id,
          organizationId: id,
          metadata: JSON.stringify({ name }),
        },
      });

      return NextResponse.json({ organization: updatedOrg });
    } catch (error) {
      console.error('Update Organization Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

export const DELETE = withApiAuth({
  handler: async (req, { auth, params }) => {
    try {
      const { id } = await params; // Next.js 15 requires awaiting params

      // Verify user is OWNER
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: id,
            userId: auth.user.id,
          },
        },
      });

      if (!membership || membership.role !== 'OWNER') {
        return NextResponse.json({ error: 'Forbidden. Only owner can delete.' }, { status: 403 });
      }

      await prisma.organization.update({
        where: { id },
        data: { deletedAt: new Date() }, // Use soft-delete
      });

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          action: 'DELETE_ORGANIZATION',
          resource: 'Organization',
          resourceId: id,
          userId: auth.user.id,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete Organization Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

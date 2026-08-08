import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { withApiAuth } from '@/src/lib/apiHandler';
import { z } from 'zod';

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name too long'),
});

export const GET = withApiAuth({
  handler: async (request, { auth }) => {
    try {
      const userId = auth.user.id;

      const organizations = await prisma.organization.findMany({
        where: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      // If the user has NO organizations, auto-provision a default one
      if (organizations.length === 0) {
        const newOrg = await prisma.organization.create({
          data: {
            name: `${auth.user.name || 'User'}'s Organization`,
            slug: `org_${userId.substring(0, 8)}`,
            members: {
              create: {
                userId: userId,
                role: 'OWNER',
              },
            },
          },
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
          },
        });
        return NextResponse.json({ organizations: [newOrg] });
      }

      return NextResponse.json({ organizations });
    } catch (error) {
      console.error('Fetch Organizations Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

export const POST = withApiAuth({
  schema: createOrgSchema,
  handler: async (request, { auth, body }) => {
    try {
      const userId = auth.user.id;
      const { name } = body;

      const slug = `org_${Math.random().toString(36).substring(2, 9)}`;

      const organization = await prisma.organization.create({
        data: {
          name,
          slug,
          members: {
            create: {
              userId: userId,
              role: 'OWNER',
            },
          },
        },
      });

      return NextResponse.json({ organization });
    } catch (error) {
      console.error('Create Organization Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

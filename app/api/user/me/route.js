import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { UserService } from '@/src/lib/services/userService';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';

export const GET = withApiAuth({
  handler: async (req, { auth }) => {
    const user = await UserService.getUserProfile(auth.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  },
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(160).optional(),
  image: z.string().url().optional(),
});

export const PATCH = withApiAuth({
  schema: updateUserSchema,
  handler: async (req, { auth, body }) => {
    const { name, bio, image } = body;

    const updatedUser = await UserService.updateProfile(auth.user.id, { name, bio, image });

    return NextResponse.json({ success: true, user: updatedUser });
  },
});

export const DELETE = withApiAuth({
  handler: async (req, { auth }) => {
    const userId = auth.user.id;

    // Check if the user is the sole owner of any organizations
    const ownedOrgs = await prisma.organizationMember.findMany({
      where: {
        userId: userId,
        role: 'OWNER',
      },
      include: {
        organization: {
          include: {
            members: {
              where: { role: 'OWNER' },
            },
          },
        },
      },
    });

    const soleOwnerOrgs = ownedOrgs.filter(
      (membership) => membership.organization.members.length === 1
    );

    if (soleOwnerOrgs.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete account. You are the sole owner of one or more organizations. Please delete them or transfer ownership first.',
        },
        { status: 400 }
      );
    }

    // Prisma onDelete: Cascade will handle relations
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: 'Account deleted successfully.' });
  },
});

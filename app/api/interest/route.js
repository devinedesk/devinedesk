import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';

const appInterestSchema = z.object({
  appName: z.string().min(1, 'App name is required').max(100),
});

export const POST = withApiAuth({
  schema: appInterestSchema,
  handler: async (req, { auth, body }) => {
    try {
      const { appName } = body;

      // Upsert app interest
      const interest = await prisma.appInterest.upsert({
        where: {
          userId_appName: {
            userId: auth.user.id,
            appName: appName,
          },
        },
        update: {},
        create: {
          userId: auth.user.id,
          appName: appName,
        },
      });

      return NextResponse.json(interest, { status: 201 });
    } catch (error) {
      console.error('Error recording app interest:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

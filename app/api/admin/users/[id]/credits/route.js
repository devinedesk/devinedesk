import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';

const creditSchema = z.object({
  amount: z.number().int().positive(),
});

export const POST = withApiAuth({
  requireAdmin: true,
  schema: creditSchema,
  handler: async (req, { body, params }) => {
    const { id } = params;
    const { amount } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add credits via transaction to maintain ledger
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { credits: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId: id,
          amount: amount,
          type: 'bonus',
          description: 'Admin Manual Credit Grant',
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'ADMIN_GRANT_CREDITS',
          resource: 'User',
          resourceId: id,
          metadata: JSON.stringify({ amount }),
        },
      }),
    ]);

    return NextResponse.json({ success: true, added: amount });
  },
});

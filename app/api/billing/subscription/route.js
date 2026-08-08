import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { withApiAuth } from '@/src/lib/apiHandler';

export const GET = withApiAuth({
  handler: async (req, { auth }) => {
    try {
      const userId = auth.user.id;

      // Find active subscription for user
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: userId,
          status: {
            in: ['active', 'trialing'],
          },
        },
        orderBy: {
          currentPeriodEnd: 'desc',
        },
      });

      if (!subscription) {
        return NextResponse.json({
          plan: 'Free',
          status: 'inactive',
          isActive: false,
        });
      }

      return NextResponse.json({
        plan: 'Pro',
        status: subscription.status,
        isActive: true,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        stripePriceId: subscription.stripePriceId,
      });
    } catch (error) {
      console.error('Fetch Subscription Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

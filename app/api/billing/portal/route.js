import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import Stripe from 'stripe';
import prisma from '@/src/lib/prisma';

let stripe = null;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('mock')) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
}

export const POST = withApiAuth({
  handler: async (request, { auth }) => {
    try {
      if (!stripe) {
        return NextResponse.json(
          { error: 'Stripe is not configured on this environment.' },
          { status: 500 }
        );
      }

      const userId = auth.user.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.stripeCustomerId) {
        return NextResponse.json({ error: 'No active billing customer found' }, { status: 400 });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/billing`,
      });

      return NextResponse.json({ url: portalSession.url }, { status: 200 });
    } catch (error) {
      console.error('Stripe Portal Error:', error);
      return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
    }
  },
});

import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import Stripe from 'stripe';
import env from '@/src/lib/env';
import { UserService } from '@/src/lib/services/userService';

export const POST = withApiAuth({
  handler: async (request, { auth }) => {
    if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.includes('mock')) {
      return NextResponse.json(
        { error: 'Stripe configuration is missing or invalid for production environment' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const { user } = auth;
    if (!user) {
      return NextResponse.json({ error: 'User session required for checkout' }, { status: 401 });
    }

    const dbUser = await UserService.getUserById(user.id);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let customerId = dbUser.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.name,
        metadata: { userId: dbUser.id },
      });
      customerId = customer.id;
      await UserService.setStripeCustomerId(dbUser.id, customerId);
    }

    // Default to a fallback price ID if environment variable isn't set
    const priceId = process.env.STRIPE_PRO_PRICE_ID || 'price_1234567890';

    // Create Stripe Checkout Session for Subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${env.NEXT_PUBLIC_APP_URL}/settings/subscription?success=true`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/settings/subscription?canceled=true`,
      metadata: {
        userId: dbUser.id,
        type: 'pro_plan',
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  },
});

import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import Stripe from 'stripe';
import env from '@/src/lib/env';
import { z } from 'zod';
import { UserService } from '@/src/lib/services/userService';

const checkoutSchema = z.object({
  packageId: z.string().min(1),
});

export const POST = withApiAuth({
  schema: checkoutSchema,
  handler: async (request, { auth, body }) => {
    if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.includes('mock')) {
      return NextResponse.json({ error: 'Stripe configuration is missing or invalid for production environment' }, { status: 500 });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const { user } = auth;
    // Note: auth middleware guarantees auth.authorized is true, but for checkout we usually need a full session user
    if (!user) {
        return NextResponse.json({ error: 'User session required for checkout' }, { status: 401 });
    }

    const { packageId } = body;
    
    // Mapping of price/packages
    const PACKAGES = {
      'pkg_500': { credits: 500, priceCents: 500, name: '500 Credits' },
      'pkg_2000': { credits: 2000, priceCents: 1500, name: '2000 Credits (Discounted)' },
      'pkg_5000': { credits: 5000, priceCents: 3500, name: '5000 Credits (Best Value)' },
    };
    
    const selectedPackage = PACKAGES[packageId];

    if (!selectedPackage) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 });
    }

    // Get user from DB to check for existing Stripe customer ID
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

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: `Top up your DevineDesk account with ${selectedPackage.credits} credits.`,
            },
            unit_amount: selectedPackage.priceCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        userId: dbUser.id,
        credits: selectedPackage.credits,
        packageId: packageId,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  }
});

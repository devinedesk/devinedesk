import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Stripe from 'stripe';
import prisma from '@/src/lib/prisma';

export async function POST(req) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('mock')) {
      return NextResponse.json({ error: 'Stripe configuration is missing or invalid for production environment' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId } = await req.json();
    
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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?canceled=true`,
      metadata: {
        userId: user.id,
        credits: selectedPackage.credits,
        packageId: packageId,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });

  } catch (error) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

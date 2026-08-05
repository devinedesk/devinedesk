import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Stripe from 'stripe';
import prisma from '@/src/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

// Mapping of price/packages
const PACKAGES = {
  'pkg_500': { credits: 500, priceCents: 500, name: '500 Credits' }, // $5.00
  'pkg_2000': { credits: 2000, priceCents: 1500, name: '2000 Credits (Discounted)' }, // $15.00
  'pkg_5000': { credits: 5000, priceCents: 3500, name: '5000 Credits (Best Value)' }, // $35.00
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId } = await req.json();
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

    // If Stripe is configured and we don't have a mock key
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('mock')) {
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
    } else {
      // Mock mode for local dev without Stripe keys
      // Just simulate a successful top-up directly
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: selectedPackage.credits } },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: selectedPackage.credits,
          type: 'purchase',
          description: `Mock purchase of ${selectedPackage.name}`,
          stripePaymentId: 'mock_tx_' + Date.now(),
        }
      });

      return NextResponse.json({ url: '/billing?success=true' });
    }
  } catch (error) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/src/lib/env';
import { BillingService } from '@/src/lib/services/billingService';
import prisma from '@/src/lib/prisma';

export async function POST(req) {
  const ip = req?.headers?.get('x-forwarded-for') ?? '127.0.0.1';
  const rateLimit = await checkRateLimit(`${ip}_api`, 'FREE'); // Default to free tier globally
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    );
  }

  try {
    if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.includes('mock')) {
      return NextResponse.json(
        { error: 'Stripe configuration is missing or invalid for production environment' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 400 });
    }

    const payload = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed.`, err.message);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const credits = parseInt(session.metadata.credits, 10);
      const paymentId = session.payment_intent;

      if (userId && credits) {
        try {
          // Check for idempotency
          const isProcessed = await BillingService.checkTransactionProcessed(paymentId);

          if (isProcessed) {
            console.log(`Transaction ${paymentId} already processed. Skipping.`);
            return NextResponse.json({ received: true });
          }

          await BillingService.addCredits(
            userId,
            credits,
            `Purchased ${credits} credits via Stripe`,
            paymentId
          );
          console.log(`Successfully credited ${credits} to user ${userId}`);
        } catch (dbErr) {
          console.error('Database error updating credits after webhook:', dbErr);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const subscription = event.data.object;

      await prisma.subscription.upsert({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        update: {
          status: subscription.status,
          stripePriceId: subscription.items.data[0].price.id,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
        create: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          userId: subscription.metadata.userId || null,
          organizationId: subscription.metadata.organizationId || null,
        },
      });
      console.log(`Updated subscription ${subscription.id} status to ${subscription.status}`);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;

      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: 'canceled',
          cancelAtPeriodEnd: false,
        },
      });
      console.log(`Canceled subscription ${subscription.id}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

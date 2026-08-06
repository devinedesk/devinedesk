import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/src/lib/env';
import { BillingService } from '@/src/lib/services/billingService';

export async function POST(req) {
  try {
    if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.includes('mock')) {
      return NextResponse.json({ error: 'Stripe configuration is missing or invalid for production environment' }, { status: 500 });
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

          await BillingService.addCredits(userId, credits, `Purchased ${credits} credits via Stripe`, paymentId);
          console.log(`Successfully credited ${credits} to user ${userId}`);
        } catch (dbErr) {
          console.error('Database error updating credits after webhook:', dbErr);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/src/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
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
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: credits } },
          }),
          prisma.transaction.create({
            data: {
              userId: userId,
              amount: credits,
              type: 'purchase',
              description: `Purchased ${credits} credits via Stripe`,
              stripePaymentId: paymentId,
            }
          })
        ]);
        console.log(`Successfully credited ${credits} to user ${userId}`);
      } catch (dbErr) {
        console.error('Database error updating credits after webhook:', dbErr);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}

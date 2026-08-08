import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/src/lib/prisma';
import { NotificationService } from '@/src/lib/services/notificationService';
import { BillingService } from '@/src/lib/services/billingService';
import { EmailService } from '@/src/lib/services/emailService';
import { logger } from '@/lib/logger';

// Initialize Stripe (will fail gracefully if key is missing in dev)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('mock')) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe is not configured on this environment' },
      { status: 500 }
    );
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;

  try {
    if (endpointSecret && signature) {
      event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } else {
      // Allow bypassing verification in local dev if secret is not set,
      // but warn heavily. In production this MUST fail.
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Webhook signature verification failed. Missing secret.');
      }
      logger.warn('Skipping Stripe webhook signature verification in development.');
      event = JSON.parse(payload);
    }
  } catch (err) {
    logger.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Ensure this is a subscription checkout
      if (session.mode === 'subscription') {
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (userId) {
          // Update user's stripeCustomerId
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId },
          });

          // Fetch subscription details from Stripe
          const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);

          // Upsert Subscription record
          await prisma.subscription.upsert({
            where: { stripeSubscriptionId: subscriptionId },
            update: {
              status: subscriptionData.status,
              currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
              currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
              cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
            },
            create: {
              userId: userId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: subscriptionData.items.data[0].price.id,
              status: subscriptionData.status,
              currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
              currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
              cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
            },
          });

          // Notify the user in-app
          await NotificationService.notify({
            userId,
            title: 'Subscription Activated',
            message: 'Your Pro subscription is now active! Enjoy the premium features.',
            type: 'success',
            link: '/dashboard/billing',
          });
        }
      } else if (session.mode === 'payment') {
        // Handle one-time payment for credits
        const userId = session.client_reference_id || session.metadata?.userId;
        const credits = parseInt(session.metadata?.credits || '0', 10);

        if (userId && credits > 0) {
          // Check if already processed to ensure idempotency
          const processed = await BillingService.checkTransactionProcessed(session.id);

          if (!processed) {
            const { user } = await BillingService.addCredits(
              userId,
              credits,
              `Credit Purchase: ${credits} credits`,
              session.id
            );

            logger.info(`Added ${credits} credits to user ${userId} via Stripe checkout.`);

            // Notify user
            await NotificationService.notify({
              userId,
              title: 'Credits Purchased',
              message: `Successfully added ${credits} credits to your account.`,
              type: 'success',
              link: '/dashboard/billing',
            });

            // Send email receipt
            if (user.email) {
              await EmailService.sendReceiptEmail(user.email, {
                amountPaid: session.amount_total / 100,
                currency: session.currency,
                creditsAdded: credits,
                date: new Date().toLocaleDateString(),
              });
            }
          }
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        // Find and update the corresponding Subscription record
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'canceled',
            cancelAtPeriodEnd: true,
          },
        });

        // Notify user
        await NotificationService.notify({
          userId: user.id,
          title: 'Subscription Cancelled',
          message: 'Your Pro subscription has been cancelled. You are now on the free tier.',
          type: 'warning',
          link: '/dashboard/billing',
        });
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;

      // Subscription renewals
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = subscription.metadata?.userId;

        // Assuming a Pro plan adds 1000 credits monthly
        const creditsToAdd = parseInt(subscription.metadata?.monthlyCredits || '1000', 10);

        if (userId) {
          const processed = await BillingService.checkTransactionProcessed(invoice.id);
          if (!processed) {
            const { user } = await BillingService.addCredits(
              userId,
              creditsToAdd,
              `Subscription Renewal: ${creditsToAdd} credits`,
              invoice.id
            );

            logger.info(`Renewed subscription for user ${userId}, added ${creditsToAdd} credits.`);

            // Notify user
            await NotificationService.notify({
              userId,
              title: 'Subscription Renewed',
              message: `Your subscription renewed successfully and ${creditsToAdd} credits were added.`,
              type: 'success',
              link: '/dashboard/billing',
            });

            if (user.email) {
              await EmailService.sendReceiptEmail(user.email, {
                amountPaid: invoice.amount_paid / 100,
                currency: invoice.currency,
                creditsAdded: creditsToAdd,
                date: new Date().toLocaleDateString(),
                isSubscription: true,
              });
            }
          }
        }
      }
    } else if (
      event.type !== 'checkout.session.completed' &&
      event.type !== 'customer.subscription.deleted' &&
      event.type !== 'invoice.payment_succeeded'
    ) {
      logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Error processing Stripe webhook', error);
    return NextResponse.json(
      { error: 'Internal Server Error processing webhook' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { subDays } from 'date-fns';
import { withApiAuth } from '@/src/lib/apiHandler';

export const GET = withApiAuth({
  requireAdmin: true,
  handler: async (req, { auth }) => {
    try {
      // In a real app with Stripe, you would fetch from Stripe API directly here for true MRR.
      let mrr = 0;
      let activeSubs = 0;

      try {
        if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('mock')) {
          const { default: Stripe } = await import('stripe');
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

          let hasMore = true;
          let startingAfter = undefined;

          while (hasMore) {
            const subscriptions = await stripe.subscriptions.list({
              status: 'active',
              limit: 100,
              starting_after: startingAfter,
            });

            activeSubs += subscriptions.data.length;

            for (const sub of subscriptions.data) {
              // Simplify calculation for boilerplate: assume monthly items
              for (const item of sub.items.data) {
                if (item.price.recurring && item.price.recurring.interval === 'month') {
                  mrr += (item.price.unit_amount * item.quantity) / 100;
                } else if (item.price.recurring && item.price.recurring.interval === 'year') {
                  mrr += (item.price.unit_amount * item.quantity) / 12 / 100;
                }
              }
            }

            hasMore = subscriptions.has_more;
            if (hasMore && subscriptions.data.length > 0) {
              startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
            }
          }
        } else {
          activeSubs = await prisma.subscription.count({ where: { status: 'active' } });
          mrr = 0;
        }
      } catch (stripeError) {
        console.error('Failed to fetch MRR from Stripe:', stripeError);
        activeSubs = await prisma.subscription.count({ where: { status: 'active' } });
        mrr = 0;
      }

      // 2. Platform Transactions (Credits purchased) over last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      const recentTransactions = await prisma.transaction.findMany({
        where: {
          type: 'purchase',
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: { select: { name: true, email: true } },
        },
      });

      // Simple revenue sum (Assuming amount is cents or dollars, depending on implementation. Let's assume dollars for 'amount' of credits purchased for simplicity)
      const revenue30d = recentTransactions.reduce((acc, tx) => acc + tx.amount, 0);

      return NextResponse.json({
        metrics: {
          mrr,
          activeSubscriptions: activeSubs,
          revenue30d,
        },
        recentTransactions,
      });
    } catch (error) {
      console.error('[ADMIN_FINANCE_GET]', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },
});

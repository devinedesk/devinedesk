import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';

export const GET = withApiAuth({
  handler: async (req, { auth }) => {
    // In a real application, this would fetch from Stripe using auth.user.stripeCustomerId
    const invoices = [
      {
        id: 'inv_123',
        date: '2026-08-01T10:00:00Z',
        amount: 35.00,
        status: 'PAID',
        description: '5000 Credits Package (Pro)',
        url: '#',
      },
      {
        id: 'inv_122',
        date: '2026-07-01T10:00:00Z',
        amount: 35.00,
        status: 'PAID',
        description: '5000 Credits Package (Pro)',
        url: '#',
      },
      {
        id: 'inv_121',
        date: '2026-06-01T10:00:00Z',
        amount: 15.00,
        status: 'PAID',
        description: '2000 Credits Package',
        url: '#',
      }
    ];

    return NextResponse.json({ invoices });
  },
});

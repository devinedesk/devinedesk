import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';

const createTransactionSchema = z.object({
  amount: z.number(),
  type: z.string().min(1),
  description: z.string().optional(),
  stripePaymentId: z.string().optional(),
});

export const GET = withApiAuth({
  handler: async (req, { auth }) => {
    try {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const page = parseInt(searchParams.get('page') || '1');
      const skip = (page - 1) * limit;

      const transactions = await prisma.transaction.findMany({
        where: { userId: auth.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      });

      const total = await prisma.transaction.count({
        where: { userId: auth.user.id },
      });

      return NextResponse.json({
        transactions,
        metadata: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

export const POST = withApiAuth({
  schema: createTransactionSchema,
  handler: async (req, { auth, body }) => {
    try {
      const { amount, type, description, stripePaymentId } = body;

      const transaction = await prisma.transaction.create({
        data: {
          userId: auth.user.id,
          amount,
          type,
          description,
          stripePaymentId,
        },
      });

      return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
      console.error('Error creating transaction:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

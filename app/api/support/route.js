import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  category: z.enum(['BUG', 'FEATURE', 'BILLING', 'GENERAL']).default('GENERAL'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  message: z.string().min(1, 'Message is required'),
});

export const GET = withApiAuth({
  handler: async (req, { auth }) => {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: auth.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({ tickets });
  },
});

export const POST = withApiAuth({
  schema: createTicketSchema,
  handler: async (req, { auth, body }) => {
    const { subject, category, priority, message } = body;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: auth.user.id,
        subject,
        category,
        priority,
        status: 'OPEN',
        messages: {
          create: {
            senderId: auth.user.id,
            content: message,
            isStaff: false,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ success: true, ticket });
  },
});

import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';

const replySchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

const statusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
});

export const GET = withApiAuth({
  requireRole: 'ADMIN',
  handler: async (req, { params }) => {
    const { id } = params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true, image: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { name: true, email: true, image: true, role: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  },
});

export const POST = withApiAuth({
  requireRole: 'ADMIN',
  schema: replySchema,
  handler: async (req, { auth, body, params }) => {
    const { id } = params;
    const { message } = body;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        senderId: auth.user.id,
        content: message,
        isStaff: true,
      },
    });

    // Automatically mark as IN_PROGRESS if it was OPEN and staff replied
    const updateData = { updatedAt: new Date() };
    if (ticket.status === 'OPEN') {
      updateData.status = 'IN_PROGRESS';
    }

    await prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: newMessage, newStatus: updateData.status });
  },
});

export const PATCH = withApiAuth({
  requireRole: 'ADMIN',
  schema: statusSchema,
  handler: async (req, { body, params }) => {
    const { id } = params;
    const { status } = body;

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, ticket: updatedTicket });
  },
});

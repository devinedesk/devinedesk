import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';

const replySchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

export const GET = withApiAuth({
  handler: async (req, { auth, params }) => {
    const { id } = params;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        userId: auth.user.id, // Ensure user owns the ticket
      },
      include: {
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
  schema: replySchema,
  handler: async (req, { auth, body, params }) => {
    const { id } = params;
    const { message } = body;

    // Verify ownership
    const ticket = await prisma.supportTicket.findFirst({
      where: { id, userId: auth.user.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        senderId: auth.user.id,
        content: message,
        isStaff: false,
      },
    });

    // Update ticket timestamp
    await prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: newMessage });
  },
});

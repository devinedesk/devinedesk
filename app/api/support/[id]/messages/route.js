import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';
import { withApiAuth } from '@/src/lib/apiHandler';

// GET /api/support/[id]/messages
export const GET = withApiAuth({
  handler: async (req, { auth, params }) => {
    try {
      const { id: ticketId } = await params;
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      // Check permissions: Must be ticket owner or admin
      const isAdmin = auth.user.role === 'ADMIN' || auth.user.role === 'SUPER_ADMIN';
      if (ticket.userId !== auth.user.id && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const messages = await prisma.supportMessage.findMany({
        where: { ticketId },
        orderBy: { createdAt: 'asc' },
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            },
          },
        },
      });

      return NextResponse.json(messages);
    } catch (error) {
      console.error('Error fetching support messages:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

const createSupportMessageSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

// POST /api/support/[id]/messages
export const POST = withApiAuth({
  schema: createSupportMessageSchema,
  handler: async (req, { auth, body, params }) => {
    try {
      const { id: ticketId } = await params;
      const { content } = body;

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      const isAdmin = auth.user.role === 'ADMIN' || auth.user.role === 'SUPER_ADMIN';
      if (ticket.userId !== auth.user.id && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const message = await prisma.supportMessage.create({
        data: {
          ticketId,
          senderId: auth.user.id,
          content,
          isStaff: isAdmin,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // If staff replies, optionally update ticket status to IN_PROGRESS or WAITING_ON_CUSTOMER
      if (isAdmin && ticket.status === 'OPEN') {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return NextResponse.json(message, { status: 201 });
    } catch (error) {
      console.error('Error creating support message:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

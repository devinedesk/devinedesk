import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';
import { withApiAuth } from '@/src/lib/apiHandler';

// GET /api/conversations/[id]/messages
export const GET = withApiAuth({
  handler: async (req, { auth, params }) => {
    try {
      const { id: conversationId } = await params;
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');

      // Verify conversation belongs to user
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      if (conversation.userId !== auth.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      return NextResponse.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

const createMessageSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  role: z.enum(['user', 'assistant', 'system']).optional().default('user'),
});

// POST /api/conversations/[id]/messages
// This route typically handles a user message and triggers the AI response
export const POST = withApiAuth({
  schema: createMessageSchema,
  handler: async (req, { auth, body, params }) => {
    try {
      const { id: conversationId } = await params;
      const { content, role } = body;

      // Default to 'user' role if not specified by a system/admin bypass
      const messageRole = role === 'assistant' || role === 'system' ? role : 'user';

      // Verify conversation belongs to user
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { agent: true },
      });

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      if (conversation.userId !== auth.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Save the user message
      const userMessage = await prisma.message.create({
        data: {
          conversationId,
          content,
          role: messageRole,
        },
      });

      return NextResponse.json(userMessage, { status: 201 });
    } catch (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

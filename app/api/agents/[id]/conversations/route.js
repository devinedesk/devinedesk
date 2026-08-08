import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { withApiAuth } from '@/src/lib/apiHandler';

// GET /api/agents/[id]/conversations
export const GET = withApiAuth({
  handler: async (req, { auth, params }) => {
    try {
      const { id: agentId } = await params;
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const page = parseInt(searchParams.get('page') || '1');
      const skip = (page - 1) * limit;

      // Verify agent exists and belongs to user (or is public)
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      if (agent.userId !== auth.user.id && !agent.isPublic) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Only fetch conversations for the current user interacting with this agent
      const conversations = await prisma.conversation.findMany({
        where: {
          agentId,
          userId: auth.user.id,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: skip,
        include: {
          _count: {
            select: { messages: true },
          },
        },
      });

      return NextResponse.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

// POST /api/agents/[id]/conversations
export const POST = withApiAuth({
  handler: async (req, { auth, params }) => {
    try {
      const { id: agentId } = await params;

      // Verify agent exists and belongs to user (or is public)
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      if (agent.userId !== auth.user.id && !agent.isPublic) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Create a new conversation
      const conversation = await prisma.conversation.create({
        data: {
          agentId,
          userId: auth.user.id,
        },
      });

      return NextResponse.json(conversation, { status: 201 });
    } catch (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

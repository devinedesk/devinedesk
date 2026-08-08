import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAdapterForModel } from '@/src/lib/providerRouter';
import { rateLimit } from '@/lib/security';

export async function POST(req, { params }) {
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

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Phase 14 Security: Rate Limit AI Chat (e.g. 15 requests per minute per user)
    const rateLimitResult = await rateLimit(req, 15, 60, session.user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { slug } = params;
    const body = await req.json();
    const { message, history, conversationId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Find the agent
    const agent = await prisma.agent.findUnique({
      where: { slug },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Find or create conversation
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      // Look for a recent conversation today, or create a new one
      const recent = await prisma.conversation.findFirst({
        where: { agentId: agent.id, userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
      });

      if (recent) {
        currentConversationId = recent.id;
      } else {
        const newConv = await prisma.conversation.create({
          data: { agentId: agent.id, userId: session.user.id },
        });
        currentConversationId = newConv.id;
      }
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: currentConversationId,
        role: 'user',
        content: message,
      },
    });

    // Invoke actual LLM via Provider Router
    let finalReply = '';
    try {
      // Build internal model representation
      const modelInfo = { id: agent.model || 'openai/gpt-3.5-turbo', provider: 'openrouter' };
      const adapter = getAdapterForModel(modelInfo, 't2i'); // Default text generation adapter

      const aiResponse = await adapter.generateImage({
        model: modelInfo.id,
        prompt: `System: ${agent.systemPrompt || 'You are a helpful assistant.'}\n\nUser: ${message}`,
        _apiKey: process.env.OPENROUTER_API_KEY || '',
      });

      finalReply = aiResponse.url || "I'm sorry, I was unable to generate a response.";
    } catch (llmError) {
      console.error('LLM Invocation Error:', llmError);
      finalReply = `I encountered an error connecting to my neural network: ${llmError.message}`;
    }

    // Save AI response
    await prisma.message.create({
      data: {
        conversationId: currentConversationId,
        role: 'assistant',
        content: finalReply,
      },
    });

    return NextResponse.json({
      reply: finalReply,
      conversationId: currentConversationId,
    });
  } catch (error) {
    console.error('Error in agent chat endpoint:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

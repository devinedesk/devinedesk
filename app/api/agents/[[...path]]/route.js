import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { AgentService } from '@/src/lib/services/agentService';
import { env } from '@/src/lib/env';
import { z } from 'zod';
import { BillingService } from '@/src/lib/services/billingService';

const createAgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  system_prompt: z.string().optional(),
});

const chatAgentSchema = z.object({
  conversation_id: z.string().optional(),
  message: z.string().min(1),
});

export const GET = withApiAuth({
  handler: async (request, { auth, params }) => {
    const slug = await params;
    const segments = slug.path || [];
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    if (segments.length === 0 || (segments[0] === 'user' && segments[1] === 'agents')) {
      const isTemplate = searchParams.get('is_template') === 'true';
      if (isTemplate) {
        return NextResponse.json({ agents: [] });
      }
      const agents = await AgentService.getAgents(auth.user.id);
      return NextResponse.json({ agents });
    }

    if (segments[0] === 'featured' && segments[1] === 'agents') {
      return NextResponse.json({ agents: [] });
    }

    if (segments[0] === 'user' && segments[1] === 'conversations') {
      const conversations = await AgentService.getConversations(auth.user.id);
      return NextResponse.json(conversations);
    }

    if (segments[0] === 'by-slug' && segments[1] && segments[2]) {
      const slugVal = segments[1];
      const conversationId = segments[2];
      const conversation = await AgentService.getConversation(conversationId, auth.user.id);
      if (!conversation) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
      return NextResponse.json(conversation);
    }

    if (segments[0] === 'by-slug' && segments[1]) {
      const slugVal = segments[1];
      const agent = await AgentService.getAgentBySlug(slugVal);
      if (!agent) return NextResponse.json({ detail: 'Not found' }, { status: 404 });

      const conversations = await AgentService.getAgentConversations(agent.id, auth.user.id);

      return NextResponse.json({ ...agent, conversations });
    }

    if (segments[0] === 'templates') {
      return NextResponse.json({ agents: [] });
    }

    if (segments[0] === 'requests' && segments[1]) {
      return NextResponse.json({ detail: 'Polling deprecated on this backend' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  },
});

export const POST = withApiAuth({
  handler: async (request, { auth, body, params }) => {
    // Fallback for body parsing if undefined
    let payload = body;
    if (!payload) {
      try {
        payload = await request.clone().json();
      } catch (e) {
        payload = {};
      }
    }

    const slug = await params;
    const segments = slug.path || [];

    if (segments[0] === 'create' || segments.length === 0) {
      const parsed = createAgentSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid payload', details: parsed.error.issues },
          { status: 400 }
        );
      }
      const data = parsed.data;

      const newAgent = await AgentService.createAgent(auth.user.id, data);

      return NextResponse.json({ ...newAgent, system_prompt: newAgent.systemPrompt });
    }

    if (segments[0] === 'by-slug' && segments[2] === 'chat') {
      const parsed = chatAgentSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid payload', details: parsed.error.issues },
          { status: 400 }
        );
      }
      const chatData = parsed.data;

      const slugVal = segments[1];
      const agent = await AgentService.getAgentBySlug(slugVal);
      if (!agent) return NextResponse.json({ detail: 'Agent not found' }, { status: 404 });

      const conversation = await AgentService.getOrCreateConversation(
        chatData.conversation_id,
        auth.user.id,
        agent.id
      );

      // Add user message
      await AgentService.addMessage(conversation.id, 'user', chatData.message);

      const cost = 5;
      if (auth.method === 'session') {
        try {
          await BillingService.queueGeneration(auth.user.id, cost, 'agent_chat');
        } catch (err) {
          const status = err.message.includes('User not found') ? 404 : 402;
          return NextResponse.json({ detail: err.message }, { status });
        }
      }

      const { generateQueue } = await import('@/src/lib/queue');
      const job = await generateQueue.add(
        'agent_chat',
        {
          action: 'agent_chat',
          params: {
            agentId: agent.id,
            conversationId: conversation.id,
            message: chatData.message,
            model: agent.model || 'meta-llama/llama-3.1-8b-instruct:free',
            systemPrompt: agent.systemPrompt,
            agentSlug: agent.slug,
          },
          userId: auth.method === 'session' ? auth.user.id : null,
          cost: cost,
          authMethod: auth.method,
        },
        {
          attempts: 1,
          backoff: { type: 'exponential', delay: 2000 },
        }
      );

      const { QueueEvents } = await import('bullmq');
      const queueEvents = new QueueEvents('generate-queue', {
        connection: generateQueue.opts.connection,
      });

      try {
        // Wait for the worker to process the job inline (timeout is handled by worker or Vercel)
        const result = await job.waitUntilFinished(queueEvents);
        return NextResponse.json({
          is_complete: true,
          conversation_id: conversation.id,
          messages: result.messages || [],
          reply: result.reply || 'No response received.',
          suggestions: [],
        });
      } catch (err) {
        console.error('Job wait error:', err);
        return NextResponse.json({ detail: 'Failed to process chat' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  },
});

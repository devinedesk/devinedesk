import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const segments = params.path || [];
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    if (segments.length === 0 || (segments[0] === 'user' && segments[1] === 'agents')) {
        // GET /api/agents or GET /api/agents/user/agents
        const isTemplate = searchParams.get('is_template') === 'true';
        if (isTemplate) {
            return NextResponse.json({ agents: [] }); // No templates for now
        }
        const agents = await prisma.agent.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ agents });
    }

    if (segments[0] === 'featured' && segments[1] === 'agents') {
        return NextResponse.json({ agents: [] });
    }

    if (segments[0] === 'user' && segments[1] === 'conversations') {
        const conversations = await prisma.conversation.findMany({
            where: { userId: session.user.id },
            include: { agent: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(conversations);
    }

    if (segments[0] === 'by-slug' && segments[1] && segments[2]) {
        // GET /api/agents/by-slug/:slug/:conversationId
        const slug = segments[1];
        const conversationId = segments[2];
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId, userId: session.user.id },
            include: { messages: true }
        });
        if (!conversation) return NextResponse.json({ detail: "Not found" }, { status: 404 });
        return NextResponse.json(conversation);
    }

    if (segments[0] === 'by-slug' && segments[1]) {
        // GET /api/agents/by-slug/:slug
        const slug = segments[1];
        const agent = await prisma.agent.findUnique({
            where: { slug }
        });
        if (!agent) return NextResponse.json({ detail: "Not found" }, { status: 404 });
        
        // Also fetch conversations for this agent/user
        const conversations = await prisma.conversation.findMany({
            where: { agentId: agent.id, userId: session.user.id },
            include: { messages: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ ...agent, conversations });
    }

    if (segments[0] === 'templates') {
        return NextResponse.json({ agents: [] });
    }

    // Note: The /requests endpoint is deprecated since Next.js serverless functions
    // handle agent chats synchronously and no longer return request_ids for polling.
    if (segments[0] === 'requests' && segments[1]) {
        return NextResponse.json({ detail: "Polling deprecated on this backend" }, { status: 404 });
    }

    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
}

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const segments = params.path || [];
    
    if (segments[0] === 'create') {
        // POST /api/agents/create
        const body = await request.json();
        
        const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        // Ensure slug is unique
        const existing = await prisma.agent.findUnique({ where: { slug } });
        const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

        const newAgent = await prisma.agent.create({
            data: {
                userId: session.user.id,
                slug: finalSlug,
                name: body.name,
                description: body.description || "",
                systemPrompt: body.system_prompt || "",
                model: "meta-llama/llama-3.1-8b-instruct:free"
            }
        });
        
        return NextResponse.json({ ...newAgent, system_prompt: newAgent.systemPrompt });
    }

    if (segments[0] === 'by-slug' && segments[2] === 'chat') {
        // POST /api/agents/by-slug/:slug/chat
        const slug = segments[1];
        const body = await request.json();
        
        const agent = await prisma.agent.findUnique({ where: { slug } });
        if (!agent) return NextResponse.json({ detail: "Agent not found" }, { status: 404 });

        let conversationId = body.conversation_id;
        
        let conversation;
        if (!conversationId) {
            conversation = await prisma.conversation.create({
                data: {
                    userId: session.user.id,
                    agentId: agent.id
                }
            });
            conversationId = conversation.id;
        } else {
            conversation = await prisma.conversation.findUnique({
                where: { id: conversationId }
            });
            if (!conversation) {
                conversation = await prisma.conversation.create({
                    data: {
                        id: conversationId,
                        userId: session.user.id,
                        agentId: agent.id
                    }
                });
            }
        }

        // Add user message
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'user',
                content: body.message
            }
        });

        // Get all messages
        const allMessages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' }
        });

        const messagesForLLM = [
            { role: 'system', content: agent.systemPrompt || "You are a helpful AI assistant." },
            ...allMessages.map(m => ({ role: m.role, content: m.content }))
        ];

        const cost = 5; // Standard cost per agent message
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user || user.credits < cost) {
            return NextResponse.json({ detail: "Insufficient credits to chat with agent." }, { status: 402 });
        }

        let aiContent = "I am a custom local agent! You have not configured your OpenRouter API key yet in Settings.";
        const apiKey = process.env.OPENROUTER_API_KEY;
        const modelUsed = agent.model || 'meta-llama/llama-3.1-8b-instruct:free';
        
        if (apiKey) {
            try {
                const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: modelUsed,
                        messages: messagesForLLM
                    })
                });
                const data = await resp.json();
                if (data.choices && data.choices[0]) {
                    aiContent = data.choices[0].message.content;
                } else {
                    console.error("OpenRouter error:", data);
                }
            } catch (e) {
                console.error("Fetch error:", e);
                aiContent = "Error reaching AI provider.";
            }
        }

        // Save AI message, deduct credits, and record history atomically
        let aiMsg;
        await prisma.$transaction(async (tx) => {
            aiMsg = await tx.message.create({
                data: {
                    conversationId: conversation.id,
                    role: 'assistant',
                    content: aiContent
                }
            });

            if (apiKey) {
                await tx.user.update({
                    where: { id: session.user.id },
                    data: { credits: { decrement: cost } }
                });

                await tx.transaction.create({
                    data: {
                        userId: session.user.id,
                        amount: -cost,
                        type: 'usage',
                        description: `Agent chat response: ${agent.slug}`,
                    }
                });

                await tx.generation.create({
                    data: {
                        userId: session.user.id,
                        type: 'agent_chat',
                        prompt: body.message,
                        model: modelUsed,
                        parameters: JSON.stringify({ agentId: agent.id, conversationId: conversation.id }),
                        resultUrl: aiContent,
                        status: 'completed'
                    }
                });
            }
        });

        return NextResponse.json({
            is_complete: true,
            conversation_id: conversation.id,
            messages: [...allMessages, aiMsg].map(m => ({ role: m.role, content: m.content })),
            suggestions: []
        });
    }

    if (segments.length === 0) {
        // POST /api/agents (handled by create for simplicity, assuming generic agent creation form falls back here)
        const body = await request.json();
        
        const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        // Ensure slug is unique
        const existing = await prisma.agent.findUnique({ where: { slug } });
        const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

        const newAgent = await prisma.agent.create({
            data: {
                userId: session.user.id,
                slug: finalSlug,
                name: body.name,
                description: body.description || "",
                systemPrompt: body.system_prompt || "",
                model: "meta-llama/llama-3.1-8b-instruct:free"
            }
        });
        
        return NextResponse.json({ ...newAgent, system_prompt: newAgent.systemPrompt });
    }

    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
}

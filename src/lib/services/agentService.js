import prisma from '@/src/lib/prisma';

export class AgentService {
    /**
     * Get all agents for a user
     */
    static async getAgents(userId) {
        if (!userId) return [];
        return prisma.agent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get all conversations for a user
     */
    static async getConversations(userId) {
        if (!userId) return [];
        return prisma.conversation.findMany({
            where: { userId },
            include: { agent: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get a specific conversation
     */
    static async getConversation(conversationId, userId) {
        if (!conversationId || !userId) return null;
        return prisma.conversation.findUnique({
            where: { id: conversationId, userId },
            include: { messages: true }
        });
    }

    /**
     * Get an agent by slug
     */
    static async getAgentBySlug(slug) {
        if (!slug) return null;
        return prisma.agent.findUnique({
            where: { slug }
        });
    }

    /**
     * Get conversations for a specific agent
     */
    static async getAgentConversations(agentId, userId) {
        if (!agentId || !userId) return [];
        return prisma.conversation.findMany({
            where: { agentId, userId },
            include: { messages: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Create a new agent
     */
    static async createAgent(userId, data) {
        if (!userId || !data) return null;
        const payloadSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const existing = await prisma.agent.findUnique({ where: { slug: payloadSlug } });
        const finalSlug = existing ? `${payloadSlug}-${Date.now()}` : payloadSlug;

        return prisma.agent.create({
            data: {
                userId,
                slug: finalSlug,
                name: data.name,
                description: data.description || "",
                systemPrompt: data.system_prompt || "",
                model: "meta-llama/llama-3.1-8b-instruct:free"
            }
        });
    }

    /**
     * Create or get a conversation
     */
    static async getOrCreateConversation(conversationId, userId, agentId) {
        if (!conversationId) {
            return prisma.conversation.create({
                data: { userId, agentId }
            });
        }
        
        const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
        if (!conversation) {
            return prisma.conversation.create({
                data: { id: conversationId, userId, agentId }
            });
        }
        return conversation;
    }

    /**
     * Add a message to a conversation
     */
    static async addMessage(conversationId, role, content) {
        return prisma.message.create({
            data: { conversationId, role, content }
        });
    }

    /**
     * Process an agent chat (worker side)
     */
    static async processAgentChat(params, keys, userId) {
        const { conversationId, model, systemPrompt, agentId } = params;
        
        // Get all messages
        const allMessages = await prisma.message.findMany({
            where: { conversationId: conversationId },
            orderBy: { createdAt: 'asc' }
        });

    const messagesForLLM = [
        { role: 'system', content: systemPrompt || "You are a helpful AI assistant." },
        ...allMessages.map(m => ({ role: m.role, content: m.content }))
    ];

    let aiContent = "I am a custom local agent! You have not configured your OpenRouter API key yet in Settings.";
    const apiKey = keys.openrouterKey;
    
    if (apiKey) {
        try {
            const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model || 'meta-llama/llama-3.1-8b-instruct:free',
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

    const aiMsg = await prisma.message.create({
        data: {
            conversationId: conversationId,
            role: 'assistant',
            content: aiContent
        }
    });

        return {
            messages: [...allMessages, aiMsg].map(m => ({ role: m.role, content: m.content })),
            reply: aiContent
        };
    }
}

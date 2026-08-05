import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

async function readJson(file) {
    try {
        const data = await fs.readFile(file, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function readJsonObj(file) {
    try {
        const data = await fs.readFile(file, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

async function writeJson(file, data) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function GET(request, { params }) {
    const segments = params.path || [];
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const agents = await readJson(AGENTS_FILE);

    if (segments.length === 0) {
        // GET /api/agents
        const isTemplate = searchParams.get('is_template') === 'true';
        if (isTemplate) {
            return NextResponse.json({ agents: [] }); // No templates for now
        }
        return NextResponse.json({ agents });
    }

    if (segments[0] === 'by-slug' && segments[1]) {
        // GET /api/agents/by-slug/:slug
        const slug = segments[1];
        const agent = agents.find(a => a.slug === slug);
        if (!agent) return NextResponse.json({ detail: "Not found" }, { status: 404 });
        return NextResponse.json(agent);
    }

    if (segments[0] === 'templates') {
        return NextResponse.json({ agents: [] });
    }

    return NextResponse.json({ detail: "Not implemented" }, { status: 404 });
}

export async function POST(request, { params }) {
    const segments = params.path || [];
    
    if (segments[0] === 'create') {
        // POST /api/agents/create
        const body = await request.json();
        const agents = await readJson(AGENTS_FILE);
        
        const newAgent = {
            id: `agent_${uuidv4()}`,
            agent_id: `agent_${uuidv4()}`,
            slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: body.name,
            description: body.description || "",
            system_prompt: body.system_prompt || "",
            welcome_message: body.welcome_message || "Hello!",
            created_at: new Date().toISOString()
        };
        
        agents.push(newAgent);
        await writeJson(AGENTS_FILE, agents);
        
        return NextResponse.json(newAgent);
    }

    if (segments[0] === 'by-slug' && segments[2] === 'chat') {
        // POST /api/agents/by-slug/:slug/chat
        const slug = segments[1];
        const body = await request.json();
        
        const agents = await readJson(AGENTS_FILE);
        const agent = agents.find(a => a.slug === slug);
        if (!agent) return NextResponse.json({ detail: "Agent not found" }, { status: 404 });

        const requestId = `req_${uuidv4()}`;
        const conversationId = body.conversation_id || `conv_${uuidv4()}`;
        
        // Save initial request state
        const requests = await readJsonObj(REQUESTS_FILE);
        requests[requestId] = {
            is_complete: false,
            conversation_id: conversationId,
            agent_slug: slug
        };
        await writeJson(REQUESTS_FILE, requests);
        
        // Execute LLM asynchronously
        const apiKey = request.headers.get('x-api-key') || process.env.OPENROUTER_API_KEY;
        executeChatAsync(requestId, agent, conversationId, body.message, apiKey).catch(console.error);
        
        return NextResponse.json({ request_id: requestId, status: "processing" });
    }

    return NextResponse.json({ detail: "Not implemented" }, { status: 404 });
}

async function executeChatAsync(requestId, agent, conversationId, userMessage, apiKey) {
    try {
        const convs = await readJsonObj(CONVERSATIONS_FILE);
        if (!convs[conversationId]) {
            convs[conversationId] = {
                id: conversationId,
                messages: []
            };
        }
        
        // Add user message
        const userMsg = { id: uuidv4(), role: 'user', content: userMessage, created_at: new Date().toISOString() };
        convs[conversationId].messages.push(userMsg);
        await writeJson(CONVERSATIONS_FILE, convs);

        // Build OpenRouter prompt
        const messagesForLLM = [
            { role: 'system', content: agent.system_prompt },
            ...convs[conversationId].messages.map(m => ({ role: m.role, content: m.content }))
        ];

        let aiContent = "I am a custom local agent! You have not configured your OpenRouter API key yet in Settings.";
        if (apiKey) {
            const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-3.1-8b-instruct:free',
                    messages: messagesForLLM
                })
            });
            const data = await resp.json();
            if (data.choices && data.choices[0]) {
                aiContent = data.choices[0].message.content;
            }
        }

        // Add assistant message
        const aiMsg = { id: uuidv4(), role: 'assistant', content: aiContent, created_at: new Date().toISOString() };
        convs[conversationId].messages.push(aiMsg);
        await writeJson(CONVERSATIONS_FILE, convs);

        // Mark request as complete
        const requests = await readJsonObj(REQUESTS_FILE);
        requests[requestId] = {
            is_complete: true,
            conversation_id: conversationId,
            messages: convs[conversationId].messages,
            suggestions: []
        };
        await writeJson(REQUESTS_FILE, requests);

    } catch (e) {
        console.error("Agent execution failed:", e);
        const requests = await readJsonObj(REQUESTS_FILE);
        requests[requestId] = { is_complete: true, error: e.message };
        await writeJson(REQUESTS_FILE, requests);
    }
}

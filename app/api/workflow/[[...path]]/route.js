import { NextResponse } from 'next/server';
import { validateRequest } from '../../auth-check';
import prisma from '@/src/lib/prisma';

export async function GET(request, { params }) {
    const auth = await validateRequest(request);
    if (!auth.authorized) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const slug = await params;
    const segments = slug.path || [];

    if (segments[0] === 'get-workflow-defs') {
        const workflows = await prisma.workflow.findMany({
            where: { userId: auth.user.id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(workflows.map(w => ({
            ...w,
            nodes: JSON.parse(w.nodes || '[]'),
            edges: JSON.parse(w.edges || '[]'),
            viewport: w.viewport ? JSON.parse(w.viewport) : { x: 0, y: 0, zoom: 1 }
        })));
    }

    if (segments[0] === 'get-workflow-def' && segments[1]) {
        const wf = await prisma.workflow.findUnique({
            where: { id: segments[1], userId: auth.user.id }
        });
        if (!wf) return NextResponse.json({ detail: "Not found" }, { status: 404 });
        return NextResponse.json({
            ...wf,
            nodes: JSON.parse(wf.nodes || '[]'),
            edges: JSON.parse(wf.edges || '[]'),
            viewport: wf.viewport ? JSON.parse(wf.viewport) : { x: 0, y: 0, zoom: 1 }
        });
    }

    if (segments.length === 2 && segments[1] === 'node-schemas') {
        return NextResponse.json({}); 
    }
    
    if (segments.length === 2 && segments[1] === 'api-node-schemas') {
        return NextResponse.json({});
    }

    if (segments[0] === 'run' && segments[2] === 'api-outputs') {
        const runId = segments[1];
        const run = await prisma.workflowRun.findUnique({
            where: { id: runId, userId: auth.user.id }
        });
        
        if (run) {
            return NextResponse.json({
                run_id: run.id,
                status: run.status,
                outputs: JSON.parse(run.outputs || '{}'),
                node_outputs: JSON.parse(run.nodeOutputs || '{}'),
                error: run.error
            });
        }
        return NextResponse.json({ detail: "Run not found" }, { status: 404 });
    }

    return NextResponse.json({ detail: "Endpoint not supported in custom backend" }, { status: 404 });
}

export async function POST(request, { params }) {
    const auth = await validateRequest(request);
    if (!auth.authorized) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const slug = await params;
    const segments = slug.path || [];

    if (segments[0] === 'create') {
        const payload = await request.json();
        
        const newWf = await prisma.workflow.create({
            data: {
                userId: auth.user.id,
                name: payload.name || "Untitled Workflow",
                description: payload.description || "",
                nodes: JSON.stringify([]),
                edges: JSON.stringify([]),
                viewport: JSON.stringify({ x: 0, y: 0, zoom: 1 })
            }
        });
        
        return NextResponse.json({
            ...newWf,
            nodes: [],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        });
    }

    if (segments[0] === 'update-name' && segments[1]) {
        const payload = await request.json();
        try {
            const updated = await prisma.workflow.update({
                where: { id: segments[1], userId: auth.user.id },
                data: { name: payload.name }
            });
            return NextResponse.json({
                ...updated,
                nodes: JSON.parse(updated.nodes || '[]'),
                edges: JSON.parse(updated.edges || '[]'),
                viewport: updated.viewport ? JSON.parse(updated.viewport) : { x: 0, y: 0, zoom: 1 }
            });
        } catch (error) {
            return NextResponse.json({ detail: "Not found" }, { status: 404 });
        }
    }
    
    if (segments.length === 2 && segments[1] === 'publish') {
        const workflowId = segments[0];
        const payload = await request.json();
        try {
            const updateData = {};
            if (payload.nodes) updateData.nodes = JSON.stringify(payload.nodes);
            if (payload.edges) updateData.edges = JSON.stringify(payload.edges);
            if (payload.viewport) updateData.viewport = JSON.stringify(payload.viewport);

            const updated = await prisma.workflow.update({
                where: { id: workflowId, userId: auth.user.id },
                data: updateData
            });
            
            return NextResponse.json({
                ...updated,
                nodes: JSON.parse(updated.nodes || '[]'),
                edges: JSON.parse(updated.edges || '[]'),
                viewport: updated.viewport ? JSON.parse(updated.viewport) : { x: 0, y: 0, zoom: 1 }
            });
        } catch (error) {
            return NextResponse.json({ detail: "Not found" }, { status: 404 });
        }
    }

    if (segments.length === 2 && segments[1] === 'api-execute') {
        const workflowId = segments[0];
        const payload = await request.json();
        
        const wf = await prisma.workflow.findUnique({
            where: { id: workflowId, userId: auth.user.id }
        });
        
        if (!wf) return NextResponse.json({ detail: "Workflow not found" }, { status: 404 });

        const run = await prisma.workflowRun.create({
            data: {
                userId: auth.user.id,
                workflowId: workflowId,
                status: "PROCESSING",
                nodeOutputs: "{}",
                outputs: "{}"
            }
        });
        
        // Execute DAG asynchronously
        const parsedWorkflow = {
            ...wf,
            nodes: JSON.parse(wf.nodes || '[]'),
            edges: JSON.parse(wf.edges || '[]')
        };
        
        executeDAG(run.id, parsedWorkflow, payload.inputs, auth.user.id).catch(console.error);
        
        return NextResponse.json({ run_id: run.id, status: "processing" });
    }

    return NextResponse.json({ detail: "Not implemented in custom backend" }, { status: 404 });
}

export async function DELETE(request, { params }) {
    const auth = await validateRequest(request);
    if (!auth.authorized) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const slug = await params;
    const segments = slug.path || [];
    
    if (segments[0] === 'delete-workflow-def' && segments[1]) {
        try {
            await prisma.workflow.delete({
                where: { id: segments[1], userId: auth.user.id }
            });
            return NextResponse.json({ success: true });
        } catch (e) {
            return NextResponse.json({ detail: "Not implemented or missing" }, { status: 404 });
        }
    }
    return NextResponse.json({ detail: "Not implemented" }, { status: 404 });
}

// ----------------------------------------------------------------------------
// DAG EXECUTION ENGINE
// ----------------------------------------------------------------------------
async function executeDAG(runId, workflow, userInputs, userId) {
    const nodes = workflow.nodes || [];
    const edges = workflow.edges || [];
    
    const nodeStatus = {}; // 'pending', 'processing', 'completed', 'failed'
    nodes.forEach(n => nodeStatus[n.id] = 'pending');

    const nodeOutputs = {};
    
    try {
        let hasPendingNodes = true;
        
        while (hasPendingNodes) {
            // Find nodes that are ready to run (all incoming edges have output)
            const readyNodes = nodes.filter(n => {
                if (nodeStatus[n.id] !== 'pending') return false;
                const incomingEdges = edges.filter(e => e.target === n.id);
                return incomingEdges.every(e => nodeOutputs[e.source] !== undefined);
            });
            
            if (readyNodes.length === 0) {
                // If there are pending nodes but none are ready, it's a cycle or deadlock
                if (nodes.some(n => nodeStatus[n.id] === 'pending')) {
                    throw new Error("Deadlock detected in DAG graph or missing inputs.");
                }
                hasPendingNodes = false;
                break;
            }

            // Execute layer in parallel
            await Promise.all(readyNodes.map(async (node) => {
                nodeStatus[node.id] = 'processing';
                try {
                    // Resolve inputs from edges
                    const incomingEdges = edges.filter(e => e.target === node.id);
                    const incomingData = {};
                    
                    incomingEdges.forEach(e => {
                        const out = nodeOutputs[e.source];
                        if (out) {
                            if (!incomingData[e.targetHandle]) {
                                incomingData[e.targetHandle] = [];
                            }
                            incomingData[e.targetHandle].push(out.value);
                        }
                    });

                    // Execute based on node type
                    const output = await executeNode(node, incomingData, userInputs, userId);
                    nodeOutputs[node.id] = output;
                    nodeStatus[node.id] = 'completed';

                } catch (err) {
                    nodeStatus[node.id] = 'failed';
                    throw new Error(`Node ${node.id} (${node.type}) failed: ${err.message}`);
                }
            }));
        }

        // Aggregate final output (from terminal nodes)
        const terminalNodes = nodes.filter(n => !edges.some(e => e.source === n.id));
        const finalOutputs = {};
        terminalNodes.forEach((n, i) => {
            finalOutputs[`output_${i}`] = nodeOutputs[n.id]?.value || "No output";
        });

        await prisma.workflowRun.update({
            where: { id: runId },
            data: {
                status: "COMPLETED",
                outputs: JSON.stringify(finalOutputs),
                nodeOutputs: JSON.stringify(nodeOutputs)
            }
        });

    } catch (e) {
        console.error("Workflow Execution Failed:", e);
        await prisma.workflowRun.update({
            where: { id: runId },
            data: {
                status: "FAILED",
                error: e.message,
                nodeOutputs: JSON.stringify(nodeOutputs)
            }
        });
    }
}

// ----------------------------------------------------------------------------
// NODE EXECUTION LOGIC
// ----------------------------------------------------------------------------
async function executeNode(node, incomingData, userInputs, userId) {
    const formValues = node.data?.formValues || {};
    
    // Abstract text concatenation helper
    const getResolvedText = (baseText = "") => {
        let text = baseText;
        Object.keys(incomingData).forEach(key => {
            if (key.includes('text')) {
                text += " " + incomingData[key].join(" ");
            }
        });
        return text.trim();
    };

    // Abstract image fetch helper
    const getResolvedImage = (baseImage = "") => {
        const imageInputs = incomingData['imageInput'] || [];
        return imageInputs.length > 0 ? imageInputs[0] : baseImage;
    };

    // Helper to deduct credits and record generation history
    const recordBillingAndHistory = async (type, prompt, model, parameters, resultUrlStr) => {
        if (!userId) return;
        const cost = 5; // Standard cost per node execution
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.credits < cost) {
            throw new Error(`Insufficient credits for node ${node.id}`);
        }
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { credits: { decrement: cost } }
            }),
            prisma.transaction.create({
                data: {
                    userId: userId,
                    amount: -cost,
                    type: 'usage',
                    description: `Workflow node: ${type}`,
                }
            }),
            prisma.generation.create({
                data: {
                    userId: userId,
                    type: type,
                    prompt: prompt,
                    model: model,
                    parameters: JSON.stringify(parameters),
                    resultUrl: resultUrlStr,
                    status: 'completed'
                }
            })
        ]);
    };

    if (node.type === 'textNode' || node.type === 'text-passthrough') {
        const prompt = getResolvedText(formValues.prompt || formValues.text_prompt || formValues.text || "");
        if (!prompt) return { type: 'text', value: "Empty input" };

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return { type: 'text', value: "[Error: Missing OPENROUTER_API_KEY in .env]" };

        const modelUsed = formValues.model || 'meta-llama/llama-3.1-8b-instruct:free';
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelUsed,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await resp.json();
        const resultText = data?.choices?.[0]?.message?.content || "No output from LLM";
        
        await recordBillingAndHistory('workflow_text', prompt, modelUsed, formValues, resultText);
        return { type: 'text', value: resultText };
    }

    if (node.type === 'imageNode') {
        const prompt = getResolvedText(formValues.prompt || "");
        if (!prompt) return { type: 'image_url', value: "" };

        const apiKey = process.env.AIMLAPI_KEY;
        if (!apiKey) return { type: 'image_url', value: "Missing AIMLAPI_KEY in .env" };

        const modelUsed = formValues.model || 'stabilityai/stable-diffusion-xl-base-1.0';
        const resp = await fetch('https://api.aimlapi.com/images/generations', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelUsed,
                prompt: prompt
            })
        });
        const data = await resp.json();
        const resultUrl = data?.data?.[0]?.url || "";
        
        await recordBillingAndHistory('workflow_image', prompt, modelUsed, formValues, resultUrl);
        return { type: 'image_url', value: resultUrl };
    }
    
    if (node.type === 'videoNode') {
        const prompt = getResolvedText(formValues.prompt || "");
        const image = getResolvedImage(formValues.image_url || "");
        
        const apiKey = process.env.AIMLAPI_KEY;
        if (!apiKey) return { type: 'video_url', value: "Missing AIMLAPI_KEY in .env" };

        // Simple video fallback request
        const modelUsed = formValues.model || 'minimax/video-01';
        const resp = await fetch('https://api.aimlapi.com/v2/generate/video', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelUsed,
                prompt: prompt,
                image: image || undefined
            })
        });
        const data = await resp.json();
        const resultUrl = data?.url || data?.data?.[0]?.url || "";
        
        await recordBillingAndHistory('workflow_video', prompt, modelUsed, formValues, resultUrl);
        return { type: 'video_url', value: resultUrl };
    }

    if (node.type === 'audioNode') {
        const prompt = getResolvedText(formValues.prompt || "");
        const apiKey = process.env.AIMLAPI_KEY;
        if (!apiKey) return { type: 'audio_url', value: "Missing AIMLAPI_KEY in .env" };

        const modelUsed = formValues.model || 'suno/suno-v3.5';
        const resp = await fetch('https://api.aimlapi.com/v2/generate/audio/suno-ai/suno-v3_5', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelUsed,
                prompt: prompt,
                make_instrumental: false
            })
        });
        const data = await resp.json();
        const clipUrl = data?.clips?.[0]?.audio_url || data?.audio_url || data?.url || "";
        
        await recordBillingAndHistory('workflow_audio', prompt, modelUsed, formValues, clipUrl);
        return { type: 'audio_url', value: clipUrl };
    }

    // Default fallback
    return { type: 'unknown', value: `Executed node: ${node.id}` };
}

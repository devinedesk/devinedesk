import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'data');
const WORKFLOWS_FILE = path.join(DATA_DIR, 'workflows.json');
const RUNS_FILE = path.join(DATA_DIR, 'workflow_runs.json');

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
    const slug = await params;
    const segments = slug.path || [];

    if (segments[0] === 'get-workflow-defs') {
        const workflows = await readJson(WORKFLOWS_FILE);
        return NextResponse.json(workflows);
    }

    if (segments[0] === 'get-workflow-def' && segments[1]) {
        const workflows = await readJson(WORKFLOWS_FILE);
        const wf = workflows.find(w => w.id === segments[1]);
        if (!wf) return NextResponse.json({ detail: "Not found" }, { status: 404 });
        return NextResponse.json(wf);
    }

    if (segments.length === 2 && segments[1] === 'node-schemas') {
        return NextResponse.json({}); 
    }
    
    if (segments.length === 2 && segments[1] === 'api-node-schemas') {
        return NextResponse.json({});
    }

    if (segments[0] === 'run' && segments[2] === 'api-outputs') {
        const runId = segments[1];
        const runs = await readJsonObj(RUNS_FILE);
        const run = runs[runId];
        if (run) {
            return NextResponse.json(run);
        }
        return NextResponse.json({ detail: "Run not found" }, { status: 404 });
    }

    return NextResponse.json({ detail: "Endpoint not supported in custom backend" }, { status: 404 });
}

export async function POST(request, { params }) {
    const slug = await params;
    const segments = slug.path || [];

    if (segments[0] === 'create') {
        const payload = await request.json();
        const workflows = await readJson(WORKFLOWS_FILE);
        
        const newWf = {
            id: `wf_${uuidv4()}`,
            name: payload.name || "Untitled Workflow",
            description: payload.description || "",
            nodes: [],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        };
        
        workflows.push(newWf);
        await writeJson(WORKFLOWS_FILE, workflows);
        return NextResponse.json(newWf);
    }

    if (segments[0] === 'update-name' && segments[1]) {
        const payload = await request.json();
        const workflows = await readJson(WORKFLOWS_FILE);
        const idx = workflows.findIndex(w => w.id === segments[1]);
        if (idx !== -1) {
            workflows[idx].name = payload.name;
            await writeJson(WORKFLOWS_FILE, workflows);
            return NextResponse.json(workflows[idx]);
        }
        return NextResponse.json({ detail: "Not found" }, { status: 404 });
    }
    
    if (segments.length === 2 && segments[1] === 'publish') {
        const workflowId = segments[0];
        const payload = await request.json();
        const workflows = await readJson(WORKFLOWS_FILE);
        const idx = workflows.findIndex(w => w.id === workflowId);
        if (idx !== -1) {
            workflows[idx].nodes = payload.nodes || workflows[idx].nodes;
            workflows[idx].edges = payload.edges || workflows[idx].edges;
            workflows[idx].viewport = payload.viewport || workflows[idx].viewport;
            await writeJson(WORKFLOWS_FILE, workflows);
            return NextResponse.json(workflows[idx]);
        }
        return NextResponse.json({ detail: "Not found" }, { status: 404 });
    }

    if (segments.length === 2 && segments[1] === 'api-execute') {
        const workflowId = segments[0];
        const payload = await request.json();
        const workflows = await readJson(WORKFLOWS_FILE);
        const wf = workflows.find(w => w.id === workflowId);
        if (!wf) return NextResponse.json({ detail: "Workflow not found" }, { status: 404 });

        const runId = `run_${uuidv4()}`;
        const runs = await readJsonObj(RUNS_FILE);
        
        // Initialize state
        runs[runId] = {
            run_id: runId,
            status: "PROCESSING",
            node_outputs: {},
            outputs: {}
        };
        await writeJson(RUNS_FILE, runs);
        
        // Execute DAG asynchronously
        executeDAG(runId, wf, payload.inputs).catch(console.error);
        
        return NextResponse.json({ run_id: runId, status: "processing" });
    }

    return NextResponse.json({ detail: "Not implemented in custom backend" }, { status: 404 });
}

export async function DELETE(request, { params }) {
    const slug = await params;
    const segments = slug.path || [];
    
    if (segments[0] === 'delete-workflow-def' && segments[1]) {
        const workflows = await readJson(WORKFLOWS_FILE);
        const newWf = workflows.filter(w => w.id !== segments[1]);
        await writeJson(WORKFLOWS_FILE, newWf);
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ detail: "Not implemented" }, { status: 404 });
}

// ----------------------------------------------------------------------------
// DAG EXECUTION ENGINE
// ----------------------------------------------------------------------------
async function executeDAG(runId, workflow, userInputs) {
    let runs = await readJsonObj(RUNS_FILE);
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
                    const output = await executeNode(node, incomingData, userInputs);
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

        runs = await readJsonObj(RUNS_FILE);
        runs[runId].status = "COMPLETED";
        runs[runId].outputs = finalOutputs;
        runs[runId].node_outputs = nodeOutputs;
        await writeJson(RUNS_FILE, runs);

    } catch (e) {
        console.error("Workflow Execution Failed:", e);
        runs = await readJsonObj(RUNS_FILE);
        runs[runId].status = "FAILED";
        runs[runId].error = e.message;
        runs[runId].node_outputs = nodeOutputs;
        await writeJson(RUNS_FILE, runs);
    }
}

// ----------------------------------------------------------------------------
// NODE EXECUTION LOGIC
// ----------------------------------------------------------------------------
async function executeNode(node, incomingData, userInputs) {
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

    if (node.type === 'textNode' || node.type === 'text-passthrough') {
        const prompt = getResolvedText(formValues.prompt || formValues.text_prompt || formValues.text || "");
        if (!prompt) return { type: 'text', value: "Empty input" };

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return { type: 'text', value: "[Error: Missing OPENROUTER_API_KEY in .env]" };

        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: formValues.model || 'meta-llama/llama-3.1-8b-instruct:free',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await resp.json();
        return { type: 'text', value: data?.choices?.[0]?.message?.content || "No output from LLM" };
    }

    if (node.type === 'imageNode') {
        const prompt = getResolvedText(formValues.prompt || "");
        if (!prompt) return { type: 'image_url', value: "" };

        const apiKey = process.env.AIMLAPI_KEY;
        if (!apiKey) return { type: 'image_url', value: "Missing AIMLAPI_KEY in .env" };

        const resp = await fetch('https://api.aimlapi.com/images/generations', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: formValues.model || 'stabilityai/stable-diffusion-xl-base-1.0',
                prompt: prompt
            })
        });
        const data = await resp.json();
        return { type: 'image_url', value: data?.data?.[0]?.url || "" };
    }
    
    if (node.type === 'videoNode') {
        const prompt = getResolvedText(formValues.prompt || "");
        const image = getResolvedImage(formValues.image_url || "");
        
        const apiKey = process.env.AIMLAPI_KEY;
        if (!apiKey) return { type: 'video_url', value: "Missing AIMLAPI_KEY in .env" };

        // Simple video fallback request
        const resp = await fetch('https://api.aimlapi.com/v2/generate/video', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: formValues.model || 'minimax/video-01',
                prompt: prompt,
                image: image || undefined
            })
        });
        const data = await resp.json();
        return { type: 'video_url', value: data?.url || data?.data?.[0]?.url || "" };
    }

    if (node.type === 'audioNode') {
        const prompt = getResolvedText(formValues.prompt || "");
        const apiKey = process.env.AIMLAPI_KEY;
        if (!apiKey) return { type: 'audio_url', value: "Missing AIMLAPI_KEY in .env" };

        const resp = await fetch('https://api.aimlapi.com/v2/generate/audio/suno-ai/suno-v3_5', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: formValues.model || 'suno/suno-v3.5',
                prompt: prompt,
                make_instrumental: false
            })
        });
        const data = await resp.json();
        const clipUrl = data?.clips?.[0]?.audio_url || data?.audio_url || data?.url || "";
        return { type: 'audio_url', value: clipUrl };
    }

    // Default fallback
    return { type: 'unknown', value: `Executed node: ${node.id}` };
}

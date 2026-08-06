import { env } from '@/src/lib/env';
import { getAdapterForModel } from '@/src/lib/providerRouter';
import { BillingService } from './billingService';
import { WorkflowService } from './workflowService';
// ----------------------------------------------------------------------------
// DAG EXECUTION ENGINE
// ----------------------------------------------------------------------------
export async function executeDAG(runId, workflow, userInputs, userId) {
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

        await WorkflowService.updateWorkflowRun(runId, {
            status: "COMPLETED",
            outputs: JSON.stringify(finalOutputs),
            nodeOutputs: JSON.stringify(nodeOutputs)
        });

    } catch (e) {
        console.error("Workflow Execution Failed:", e);
        await WorkflowService.updateWorkflowRun(runId, {
            status: "FAILED",
            error: e.message,
            nodeOutputs: JSON.stringify(nodeOutputs)
        });
    }
}

// ----------------------------------------------------------------------------
// NODE EXECUTION LOGIC
// ----------------------------------------------------------------------------
export async function executeNode(node, incomingData, userInputs, userId) {
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

    const recordBillingAndHistory = async (type, prompt, model, parameters, resultUrlStr) => {
        if (!userId) return;
        const cost = 5; // Standard cost per node execution
        
        try {
            await BillingService.recordUsageAndHistory(
                userId,
                cost,
                type,
                prompt,
                model,
                parameters,
                resultUrlStr
            );
        } catch (err) {
            throw new Error(`Billing failed for node ${node.id}: ${err.message}`);
        }
    };

    if (node.type === 'textNode' || node.type === 'text-passthrough') {
        const prompt = getResolvedText(formValues.prompt || formValues.text_prompt || formValues.text || "");
        if (!prompt) return { type: 'text', value: "Empty input" };

        const apiKey = env.OPENROUTER_API_KEY;
        if (!apiKey) return { type: 'text', value: "[Error: Missing OPENROUTER_API_KEY in .env]" };

        const modelUsed = formValues.model || 'meta-llama/llama-3.1-8b-instruct:free';
        
        try {
            const adapter = getAdapterForModel({ id: modelUsed, provider: 'openrouter' }, 't2i');
            const result = await adapter.generateImage({
                prompt: prompt,
                model: modelUsed,
                _apiKey: apiKey
            });
            const resultText = result.url || "No output from LLM";
            
            await recordBillingAndHistory('workflow_text', prompt, modelUsed, formValues, resultText);
            return { type: 'text', value: resultText };
        } catch (err) {
            console.error("Text Node Error:", err);
            return { type: 'text', value: `[Error: ${err.message}]` };
        }
    }

    if (node.type === 'imageNode') {
        const prompt = getResolvedText(formValues.prompt || "");
        if (!prompt) return { type: 'image_url', value: "" };

        const apiKey = env.AIMLAPI_KEY;
        if (!apiKey) return { type: 'image_url', value: "Missing AIMLAPI_KEY in .env" };

        const modelUsed = formValues.model || 'stabilityai/stable-diffusion-xl-base-1.0';
        
        try {
            const adapter = getAdapterForModel({ id: modelUsed, provider: 'aimlapi' }, 't2i');
            const result = await adapter.generateImage({
                prompt: prompt,
                model: modelUsed,
                _apiKey: apiKey
            });
            const resultUrl = result.url || "";
            
            await recordBillingAndHistory('workflow_image', prompt, modelUsed, formValues, resultUrl);
            return { type: 'image_url', value: resultUrl };
        } catch (err) {
            console.error("Image Node Error:", err);
            return { type: 'image_url', value: "" };
        }
    }
    
    if (node.type === 'videoNode') {
        const prompt = getResolvedText(formValues.prompt || "");
        const image = getResolvedImage(formValues.image_url || "");
        
        const apiKey = env.AIMLAPI_KEY;
        if (!apiKey) return { type: 'video_url', value: "Missing AIMLAPI_KEY in .env" };

        const modelUsed = formValues.model || 'minimax/video-01';
        
        try {
            const adapter = getAdapterForModel({ id: modelUsed, provider: 'aimlapi' }, 'video');
            const result = await adapter.generateVideo({
                prompt: prompt,
                image_url: image || undefined,
                model: modelUsed,
                _apiKey: apiKey
            });
            const resultUrl = result.url || "";
            
            await recordBillingAndHistory('workflow_video', prompt, modelUsed, formValues, resultUrl);
            return { type: 'video_url', value: resultUrl };
        } catch (err) {
            console.error("Video Node Error:", err);
            return { type: 'video_url', value: "" };
        }
    }

    if (node.type === 'audioNode') {
        const prompt = getResolvedText(formValues.prompt || "");
        
        const apiKey = env.AIMLAPI_KEY;
        if (!apiKey) return { type: 'audio_url', value: "Missing AIMLAPI_KEY in .env" };

        const modelUsed = formValues.model || 'suno/suno-v3.5';
        
        try {
            const adapter = getAdapterForModel({ id: modelUsed, provider: 'aimlapi' }, 'audio');
            const result = await adapter.generateAudio({
                prompt: prompt,
                model: modelUsed,
                make_instrumental: false,
                _apiKey: apiKey
            });
            const clipUrl = result.url || "";
            
            await recordBillingAndHistory('workflow_audio', prompt, modelUsed, formValues, clipUrl);
            return { type: 'audio_url', value: clipUrl };
        } catch (err) {
            console.error("Audio Node Error:", err);
            return { type: 'audio_url', value: "" };
        }
    }

    // Default fallback
    return { type: 'unknown', value: `Executed node: ${node.id}` };
}

import { env } from '../env.js';
import { getAdapterForModel } from '../providerRouter.js';
import { BillingService } from './billingService.js';
import { WorkflowService } from './workflowService.js';
// ----------------------------------------------------------------------------
// DAG EXECUTION ENGINE
// ----------------------------------------------------------------------------
export async function executeDAG(runId, workflow, userInputs, userId) {
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];

  const nodeStatus = {}; // 'pending', 'processing', 'completed', 'failed'
  nodes.forEach((n) => (nodeStatus[n.id] = 'pending'));

  const nodeOutputs = {};

  try {
    let hasPendingNodes = true;

    while (hasPendingNodes) {
      // Find nodes that are ready to run (all incoming edges have output)
      const readyNodes = nodes.filter((n) => {
        if (nodeStatus[n.id] !== 'pending') return false;
        const incomingEdges = edges.filter((e) => e.target === n.id);
        return incomingEdges.every((e) => nodeOutputs[e.source] !== undefined);
      });

      if (readyNodes.length === 0) {
        // If there are pending nodes but none are ready, it's a cycle or deadlock
        if (nodes.some((n) => nodeStatus[n.id] === 'pending')) {
          throw new Error('Deadlock detected in DAG graph or missing inputs.');
        }
        hasPendingNodes = false;
        break;
      }

      // Execute layer in parallel
      await Promise.all(
        readyNodes.map(async (node) => {
          nodeStatus[node.id] = 'processing';
          try {
            // Resolve inputs from edges
            const incomingEdges = edges.filter((e) => e.target === node.id);
            const incomingData = {};

            incomingEdges.forEach((e) => {
              const out = nodeOutputs[e.source];
              if (out) {
                if (!incomingData[e.targetHandle]) {
                  incomingData[e.targetHandle] = [];
                }
                incomingData[e.targetHandle].push(out.value);
              }
            });

            // Execute based on node type
            const output = await executeNode(node, incomingData, userInputs, userId, nodeOutputs);
            nodeOutputs[node.id] = output;
            nodeStatus[node.id] = 'completed';

            // Incrementally update the run so the frontend can see progress
            await WorkflowService.updateWorkflowRun(runId, {
              nodeOutputs: JSON.stringify(nodeOutputs),
            });
          } catch (err) {
            nodeStatus[node.id] = 'failed';
            throw new Error(`Node ${node.id} (${node.type}) failed: ${err.message}`);
          }
        })
      );
    }

    // Aggregate final output (from terminal nodes)
    const terminalNodes = nodes.filter((n) => !edges.some((e) => e.source === n.id));
    const finalOutputs = {};
    terminalNodes.forEach((n, i) => {
      finalOutputs[`output_${i}`] = nodeOutputs[n.id]?.value || 'No output';
    });

    await WorkflowService.updateWorkflowRun(runId, {
      status: 'COMPLETED',
      outputs: JSON.stringify(finalOutputs),
      nodeOutputs: JSON.stringify(nodeOutputs),
    });

    // Dispatch Webhook Event
    try {
      const { WebhookService } = await import('./webhookService.js');
      await WebhookService.dispatchEvent(userId, 'workflow.completed', {
        runId,
        workflowId: workflow.id,
        outputs: finalOutputs,
      });
    } catch (e) {
      console.error('Webhook dispatch failed:', e);
    }
  } catch (e) {
    console.error('Workflow Execution Failed:', e);
    await WorkflowService.updateWorkflowRun(runId, {
      status: 'FAILED',
      error: e.message,
      nodeOutputs: JSON.stringify(nodeOutputs),
    });

    // Dispatch Webhook Event for Failure
    try {
      const { WebhookService } = await import('./webhookService.js');
      await WebhookService.dispatchEvent(userId, 'workflow.failed', {
        runId,
        workflowId: workflow.id,
        error: e.message,
      });
    } catch (webhookErr) {
      console.error('Webhook failure dispatch failed:', webhookErr);
    }

    throw e; // Bubble up to worker for refund processing
  }
}

// ----------------------------------------------------------------------------
// NODE EXECUTION LOGIC
// ----------------------------------------------------------------------------

/**
 * Wraps an async function with exponential backoff retries.
 * Ideal for resilient API calls to LLM/AI providers.
 */
async function withRetry(operation, maxRetries = 3, baseDelayMs = 1000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      // Don't retry on clear user/billing errors (400, 401, 402, 403)
      const status = error?.status || error?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, i);
      console.warn(
        `[Retry ${i + 1}/${maxRetries}] AI operation failed, retrying in ${delay}ms...`,
        error.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Operation failed after ${maxRetries} retries. Last error: ${lastError.message}`);
}
export async function executeNode(node, incomingData, userInputs, userId, nodeOutputsContext) {
  const formValues = node.data?.formValues || {};

  // Abstract text interpolation helper
  const interpolateTemplate = (templateStr = '') => {
    if (!templateStr || typeof templateStr !== 'string') return '';

    // Match {{ nodeId.field }} or {{ nodeId }}
    return templateStr.replace(
      /\{\{\s*([a-zA-Z0-9_-]+)(?:\.([a-zA-Z0-9_-]+))?\s*\}\}/g,
      (match, namespace, field) => {
        // Support interpolating user variables like {{ inputs.prompt }} or {{ userInputs.prompt }}
        if (namespace === 'inputs' || namespace === 'userInputs') {
          if (field && userInputs[field] !== undefined) {
            return String(userInputs[field]);
          }
          return match; // Unresolved input
        }

        const nodeOut = nodeOutputsContext[namespace];
        if (!nodeOut) {
          // Check if it's matching an incoming port name (e.g. {{ text1 }}) via incomingData as a fallback
          if (incomingData[namespace]) {
            return incomingData[namespace].join(' ');
          }
          return match;
        }

        if (field) {
          return nodeOut[field] !== undefined ? String(nodeOut[field]) : match;
        }

        // If no field specified, default to the main .value
        return nodeOut.value !== undefined ? String(nodeOut.value) : match;
      }
    );
  };

  // Abstract text concatenation helper (legacy fallback)
  const getResolvedText = (baseText = '') => {
    let text = interpolateTemplate(baseText);

    // For backwards compatibility: If the prompt didn't use {{ }} variables, we blindly append incoming text ports
    if (text === baseText && !baseText.includes('{{')) {
      Object.keys(incomingData).forEach((key) => {
        if (key.includes('text')) {
          text += ' ' + incomingData[key].join(' ');
        }
      });
    }
    return text.trim();
  };

  // Abstract image fetch helper
  const getResolvedImage = (baseImage = '') => {
    let img = interpolateTemplate(baseImage);
    if (!img || img === baseImage) {
      const imageInputs = incomingData['imageInput'] || [];
      img = imageInputs.length > 0 ? imageInputs[0] : baseImage;
    }
    return img;
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

  if (node.type === 'text-passthrough' || node.type === 'inputNode' || node.type === 'concatNode') {
    const prompt = getResolvedText(
      formValues.prompt || formValues.text_prompt || formValues.text || formValues.text1 || ''
    );
    return { type: 'text', value: prompt };
  }

  if (node.type === 'vidConcatNode') {
    const videoInputs =
      incomingData['video'] || incomingData['videoInput'] || incomingData['video1'] || [];
    return { type: 'video_url', value: videoInputs.join(',') };
  }

  if (node.type === 'textNode') {
    const prompt = getResolvedText(
      formValues.prompt || formValues.text_prompt || formValues.text || ''
    );
    if (!prompt) return { type: 'text', value: 'Empty input' };

    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) return { type: 'text', value: '[Error: Missing OPENROUTER_API_KEY in .env]' };

    const modelUsed = formValues.model || 'meta-llama/llama-3.1-8b-instruct:free';

    try {
      const adapter = getAdapterForModel({ id: modelUsed, provider: 'openrouter' }, 't2i');
      const result = await withRetry(() =>
        adapter.generateImage({
          prompt: prompt,
          model: modelUsed,
          _apiKey: apiKey,
        })
      );
      const resultText = result.url || 'No output from LLM';

      await recordBillingAndHistory('workflow_text', prompt, modelUsed, formValues, resultText);
      return { type: 'text', value: resultText };
    } catch (err) {
      console.error('Text Node Error:', err);
      return { type: 'text', value: `[Error: ${err.message}]` };
    }
  }

  if (node.type === 'imageNode') {
    const prompt = getResolvedText(formValues.prompt || '');
    if (!prompt) return { type: 'image_url', value: '' };

    const apiKey = env.AIMLAPI_KEY;
    if (!apiKey) return { type: 'image_url', value: 'Missing AIMLAPI_KEY in .env' };

    const modelUsed = formValues.model || 'stabilityai/stable-diffusion-xl-base-1.0';

    try {
      const adapter = getAdapterForModel({ id: modelUsed, provider: 'aimlapi' }, 't2i');
      const result = await withRetry(() =>
        adapter.generateImage({
          prompt: prompt,
          model: modelUsed,
          _apiKey: apiKey,
        })
      );
      const resultUrl = result.url || '';

      await recordBillingAndHistory('workflow_image', prompt, modelUsed, formValues, resultUrl);
      return { type: 'image_url', value: resultUrl };
    } catch (err) {
      console.error('Image Node Error:', err);
      return { type: 'image_url', value: '' };
    }
  }

  if (node.type === 'videoNode') {
    const prompt = getResolvedText(formValues.prompt || '');
    const image = getResolvedImage(formValues.image_url || '');

    const apiKey = env.AIMLAPI_KEY;
    if (!apiKey) return { type: 'video_url', value: 'Missing AIMLAPI_KEY in .env' };

    const modelUsed = formValues.model || 'minimax/video-01';

    try {
      const adapter = getAdapterForModel({ id: modelUsed, provider: 'aimlapi' }, 'video');
      const result = await withRetry(() =>
        adapter.generateVideo({
          prompt: prompt,
          image_url: image || undefined,
          model: modelUsed,
          _apiKey: apiKey,
        })
      );
      const resultUrl = result.url || '';

      await recordBillingAndHistory('workflow_video', prompt, modelUsed, formValues, resultUrl);
      return { type: 'video_url', value: resultUrl };
    } catch (err) {
      console.error('Video Node Error:', err);
      return { type: 'video_url', value: '' };
    }
  }

  if (node.type === 'audioNode') {
    const prompt = getResolvedText(formValues.prompt || '');

    const apiKey = env.AIMLAPI_KEY;
    if (!apiKey) return { type: 'audio_url', value: 'Missing AIMLAPI_KEY in .env' };

    const modelUsed = formValues.model || 'suno/suno-v3.5';

    try {
      const adapter = getAdapterForModel({ id: modelUsed, provider: 'aimlapi' }, 'audio');
      const result = await withRetry(() =>
        adapter.generateAudio({
          prompt: prompt,
          model: modelUsed,
          make_instrumental: false,
          _apiKey: apiKey,
        })
      );
      const clipUrl = result.url || '';

      await recordBillingAndHistory('workflow_audio', prompt, modelUsed, formValues, clipUrl);
      return { type: 'audio_url', value: clipUrl };
    } catch (err) {
      console.error('Audio Node Error:', err);
      return { type: 'audio_url', value: '' };
    }
  }

  if (node.type === 'httpNode' || node.type === 'apiNode') {
    const url = interpolateTemplate(formValues.url || '');
    const method = (formValues.method || 'GET').toUpperCase();
    const bodyTemplate = formValues.body || '';
    const headersTemplate = formValues.headers || '{}';

    if (!url) return { type: 'json', value: '{"error": "Missing URL"}' };

    try {
      const bodyStr = interpolateTemplate(bodyTemplate);
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(interpolateTemplate(headersTemplate));
      } catch (e) {
        console.warn(
          'Failed to parse headers JSON in httpNode, proceeding without custom headers.'
        );
      }

      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders,
        },
      };

      if (method !== 'GET' && method !== 'HEAD' && bodyStr) {
        fetchOptions.body = bodyStr;
      }

      const res = await fetch(url, fetchOptions);
      const contentType = res.headers.get('content-type');

      let resultData;
      if (contentType && contentType.includes('application/json')) {
        resultData = await res.json();
      } else {
        resultData = await res.text();
      }

      // Charge 1 credit for HTTP usage to prevent DDoS abuse
      try {
        await BillingService.recordUsageAndHistory(
          userId,
          1, // Cost is 1 credit for HTTP
          'workflow_http',
          url,
          method,
          formValues,
          `Status: ${res.status}`
        );
      } catch (err) {
        throw new Error(`Billing failed for HTTP node ${node.id}: ${err.message}`);
      }

      return {
        type: 'json',
        value: typeof resultData === 'object' ? JSON.stringify(resultData) : resultData,
        status: res.status,
        raw: resultData,
      };
    } catch (err) {
      console.error('HTTP Node Error:', err);
      return { type: 'json', value: `{"error": "${err.message}"}` };
    }
  }

  if (node.type === 'lipsyncNode') {
    const audioUrl = getResolvedText(formValues.audio_url || '');
    const imageUrl = getResolvedImage(formValues.image_url || '');

    const apiKey = env.FAL_KEY;
    if (!apiKey) return { type: 'video_url', value: 'Missing FAL_KEY in .env' };

    const modelUsed = formValues.model || 'fal-ai/sync-lips';

    try {
      const adapter = getAdapterForModel({ id: modelUsed, provider: 'falai' }, 'lipsync');
      const result = await withRetry(() =>
        adapter.processLipSync({
          audio_url: audioUrl,
          image_url: imageUrl,
          model: modelUsed,
          _apiKey: apiKey,
        })
      );
      const resultUrl = result.url || '';

      await recordBillingAndHistory(
        'workflow_lipsync',
        `Audio: ${audioUrl}`,
        modelUsed,
        formValues,
        resultUrl
      );
      return { type: 'video_url', value: resultUrl };
    } catch (err) {
      console.error('Lipsync Node Error:', err);
      return { type: 'video_url', value: '' };
    }
  }

  if (node.type === '3dNode') {
    const prompt = getResolvedText(formValues.prompt || '');
    const imageUrl = getResolvedImage(formValues.image_url || '');

    const apiKey = env.HF_TOKEN;
    if (!apiKey) return { type: '3d_url', value: 'Missing HF_TOKEN in .env' };

    const modelUsed = formValues.model || 'stabilityai/stable-fast-3d';

    try {
      const adapter = getAdapterForModel({ id: modelUsed, provider: 'huggingface' }, '3d');
      const result = await withRetry(() =>
        adapter.generate3D({
          prompt: prompt,
          image_url: imageUrl || undefined,
          model: modelUsed,
          _apiKey: apiKey,
        })
      );
      const resultUrl = result.url || '';

      await recordBillingAndHistory('workflow_3d', prompt, modelUsed, formValues, resultUrl);
      return { type: '3d_url', value: resultUrl };
    } catch (err) {
      console.error('3D Node Error:', err);
      return { type: '3d_url', value: '' };
    }
  }

  // Default fallback
  return { type: 'unknown', value: `Executed node: ${node.id}` };
}

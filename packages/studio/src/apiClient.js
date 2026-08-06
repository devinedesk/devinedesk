import { getModelById, getVideoModelById, getI2IModelById, getI2VModelById, getV2VModelById, getRecastModelById, getLipSyncModelById, getAudioModelById } from './models.js';
import { getAdapterForModel } from '../../../src/lib/providerRouter.js';
// In an http(s) browser we route through the host app's proxy (Next.js routes
// under /api/* re-issue the call server-side) so api.api.ai CORS is bypassed.
// SSR (no window) and Electron's file:// renderer call the upstream directly.
const BASE_URL = (typeof window !== 'undefined' && window.location?.protocol?.startsWith('http'))
    ? process.env.NEXT_PUBLIC_BACKEND_URL || '/api'
    : process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';
const PROXY_WF_BASE = '/api/workflow';

function notifyAuthRequired(status, detail) {
    if (typeof window === 'undefined') return;
    if (status !== 401 && status !== 403) return;
    window.dispatchEvent(new CustomEvent('platform:auth-required', { detail: { status, message: detail } }));
}

// Check if running in a web environment (Next.js) vs desktop (Electron/file://)
const IS_WEB_APP = typeof window !== 'undefined' && window.location?.protocol?.startsWith('http');

async function executeGeneration(action, params) {
    const url = `${BASE_URL.replace(/\/v1$/, '')}/generate`;
    
    // Use NextAuth session cookies for authentication
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, params })
    });
    
    if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const errText = errBody.error || await response.text();
        throw new Error(`Server Generation Error: ${errText}`);
    }
    
    const data = await response.json();
    
    if (data.jobId && data.status === 'queued') {
        return await pollForQueueJob(data.jobId);
    }
    
    return data;
}

async function pollForResult(requestId, key, maxAttempts = 900, interval = 2000) {
    const pollUrl = `${BASE_URL}/v1/predictions/${requestId}/result`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, {
                headers: { 'Content-Type': 'application/json', 'x-api-key': key }
            });
            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 500) continue;
                notifyAuthRequired(response.status, errText);
                throw new Error(`Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }
            const data = await response.json();
            const status = data.status?.toLowerCase();
            if (status === 'completed' || status === 'succeeded' || status === 'success') return data;
            if (status === 'failed' || status === 'error') throw new Error(`Generation failed: ${data.error || 'Unknown error'}`);
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('Generation timed out after polling.');
}

async function pollForQueueJob(jobId, maxAttempts = 300, interval = 2000) {
    const pollUrl = `${BASE_URL}/generate/${jobId}`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl);
            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 500) continue;
                throw new Error(`Queue Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }
            const data = await response.json();
            const status = data.status?.toLowerCase();
            if (status === 'completed') return data.result;
            if (status === 'failed' || status === 'error') throw new Error(`Queue job failed: ${data.error || JSON.stringify(data)}`);
        } catch (e) {
            if (e.message.includes('Queue Poll Failed')) throw e;
            console.error('Queue poll error, retrying...', e);
        }
    }
    throw new Error('Timeout waiting for queue job result');
}


async function submitAndPoll(endpoint, payload, key, onRequestId, maxAttempts = 60) {
    const url = `${BASE_URL}/v1/${endpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
    }
    const submitData = await response.json();
    const requestId = submitData.request_id || submitData.id;
    if (!requestId) return submitData;
    if (onRequestId) onRequestId(requestId);
    const result = await pollForResult(requestId, key, maxAttempts);
    const outputUrl = result.outputs?.[0] || result.url || result.output?.url;
    return { ...result, url: outputUrl };
}

export async function generateImage(apiKey, params) {
    return executeGeneration('generateImage', params);
}

export async function generateI2I(apiKey, params) {
    return executeGeneration('generateI2I', params);
}

export async function generateVideo(apiKey, params) {
    return executeGeneration('generateVideo', params);
}

export async function generateI2V(apiKey, params) {
    return executeGeneration('generateI2V', params);
}

export async function generateMarketingStudioAd(apiKey, params) {
    return executeGeneration('generateMarketingStudioAd', params);
}

export async function processV2V(apiKey, params) {
    return executeGeneration('processV2V', params);
}

export async function processRecast(apiKey, params) {
    return executeGeneration('processRecast', params);
}

export async function processLipSync(apiKey, params) {
    return executeGeneration('processLipSync', params);
}

export async function generateAudio(apiKey, params) {
    return executeGeneration('generateAudio', params);
}

export function uploadFile(apiKey, file, onProgress) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}/upload`;
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        if (apiKey) {
            xhr.setRequestHeader('x-api-key', apiKey);
        }

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    onProgress(percentComplete);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    const fileUrl = data.url;
                    if (!fileUrl) {
                        reject(new Error('No URL returned from upload'));
                    } else {
                        resolve(fileUrl);
                    }
                } catch (e) {
                    reject(new Error('Failed to parse upload response'));
                }
            } else {
                reject(new Error(`File upload failed: ${xhr.status} ${xhr.responseText}`));
            }
        };

        xhr.onerror = () => reject(new Error('Network error during file upload'));
        xhr.send(formData);
    });
}


async function apiFetch(path, options = {}) {
    const { apiKey, method = 'GET', body, ...restOptions } = options;
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (apiKey) headers['x-api-key'] = apiKey;
    
    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        ...restOptions
    });
    
    if (!response.ok) {
        if (response.status === 400) {
            try {
                const errBody = await response.json();
                if (errBody?.detail?.error) throw new Error(errBody.detail.error);
            } catch(e) {}
        }
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`API Request Failed: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

// Note: getUserBalance was removed because the frontend natively fetches /api/user/me
export async function getTemplateWorkflows(apiKey) {
    return apiFetch('/workflow/get-template-workflows', { apiKey });
};

export async function getUserWorkflows(apiKey) {
    return apiFetch('/workflow/get-workflow-defs', { apiKey });
};

export async function getPublishedWorkflows(apiKey) {
    return apiFetch('/workflow/get-published-workflows', { apiKey });
};

// Agents — uses direct URL → https://api.api.ai/agents/...
export async function getTemplateAgents(apiKey) {
    const data = await apiFetch('/agents/templates/agents', { apiKey });
    return Array.isArray(data) ? data : (data.agents || data.items || []);
};

export async function getUserAgents(apiKey) {
    const data = await apiFetch('/agents/user/agents', { apiKey });
    return Array.isArray(data) ? data : (data.agents || data.items || []);
};

export async function getPublishedAgents(apiKey) {
    const data = await apiFetch('/agents/featured/agents', { apiKey });
    return Array.isArray(data) ? data : (data.agents || data.items || []);
};

// GET /agents/user/conversations — returns the user's chat history across all agents
export async function getUserConversations(apiKey) {
    const data = await apiFetch('/agents/user/conversations', { apiKey });
    return Array.isArray(data) ? data : [];
};

// GET /agents/by-slug/{slug} — public agent details (works unauthenticated for
// published/template agents; x-api-key is sent for consistency but not required).
export async function getAgentBySlug(apiKey, slug) {
    return apiFetch(`/agents/by-slug/${slug}`, { apiKey });
}

// GET /agents/by-slug/{slug}/{conversationId} — chat history for one conversation.
export async function getAgentConversation(apiKey, agentSlug, conversationId) {
    return apiFetch(`/agents/by-slug/${agentSlug}/${conversationId}`, { apiKey });
}

// POST /agents/by-slug/{slug}/chat — send a message, returns {request_id, status}
// to poll via pollAgentChatResult.
export async function sendAgentChatMessage(apiKey, agentSlug, { message, conversationId, attachments } = {}) {
    return apiFetch(`/agents/by-slug/${agentSlug}/chat`, {
        apiKey,
        method: 'POST',
        body: {
            message,
            conversation_id: conversationId || null,
            attachments: attachments || null,
            stream: false
        }
    });
}

// Polls /api/v1/predictions/{requestId}/result until the agent turn completes.
// Unlike submitAndPoll's generic media polling, a completed agent-chat result is
// the full {conversation_id, messages, is_complete, suggestions} envelope, not a
// media URL — while processing, the endpoint doesn't surface intermediate status
// text (get_result_url_from_output only returns output_data once COMPLETED), so
// this just waits until is_complete rather than showing incremental progress.
export async function pollAgentChatResult(apiKey, requestId, { maxAttempts = 150, interval = 2000 } = {}) {
    const url = `${BASE_URL}/agents/requests/${requestId}`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            }
        });
        if (response.status === 400) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody?.detail?.error || 'Agent failed to respond');
        }
        if (!response.ok) {
            if (attempt === maxAttempts) throw new Error(`Poll failed: ${response.status}`);
            continue;
        }
        const data = await response.json();
        if (data.is_complete) return data;
    }
    throw new Error('Agent response timed out.');
}

// POST /agents — create a new persona agent (no skill picker in this minimal
// embedded form; skill_ids defaults to [] server-side, so the agent is created
// as a plain system-prompt-driven assistant with no extra tool skills attached).
export async function createAgent(apiKey, payload) {
    return apiFetch('/agents', { apiKey, method: 'POST', body: payload });
}

export async function createWorkflow(apiKey, payload) {
    return apiFetch('/workflow/create', { apiKey, method: 'POST', body: payload });
};

export async function updateWorkflowName(apiKey, workflowId, name) {
    return apiFetch(`/workflow/update-name/${workflowId}`, { apiKey, method: 'POST', body: { name } });
};

export async function deleteWorkflow(apiKey, workflowId) {
    return apiFetch(`/workflow/delete-workflow-def/${workflowId}`, { apiKey, method: 'DELETE' });
};

export async function getWorkflowInputs(apiKey, workflowId) {
    return apiFetch(`/workflow/${workflowId}/api-inputs`, { apiKey });
};

export async function executeWorkflow(apiKey, workflowId, inputs) {
    const submitData = await apiFetch(`/workflow/${workflowId}/api-execute`, { apiKey, method: 'POST', body: { inputs } });
    const runId = submitData.run_id || submitData.id;
    if (!runId) return submitData;
    return await pollWorkflowResult(runId, apiKey);
};

async function pollWorkflowResult(runId, apiKey, maxAttempts = 900, interval = 2000) {
    const pollUrl = `${BASE_URL}/workflow/run/${runId}/api-outputs`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, {
                headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }
            });
            if (!response.ok) {
                if (response.status >= 500) continue;
                throw new Error(`Poll Failed: ${response.status}`);
            }
            const data = await response.json();
            const status = data.status?.toLowerCase();
            if (status === 'completed' || status === 'succeeded' || status === 'success') return data;
            if (status === 'failed' || status === 'error') throw new Error(`Workflow failed: ${data.error || 'Unknown error'}`);
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('Workflow timed out after polling.');
};

export async function getAllNodeSchemas(apiKey, workflowId) {
    return apiFetch(`/workflow/${workflowId}/node-schemas`, { apiKey });
};

export async function getWorkflowData(apiKey, workflowId) {
    return apiFetch(`/workflow/get-workflow-def/${workflowId}`, { apiKey });
};

export async function getNodeSchemas(apiKey, workflowId) {
    return apiFetch(`/workflow/${workflowId}/api-node-schemas`, { apiKey });
}

export async function runSingleNode(apiKey, workflowId, nodeId, payload) {
    return apiFetch(`/workflow/${workflowId}/node/${nodeId}/run`, { apiKey, method: 'POST', body: payload });
}

export async function deleteNodeRun(apiKey, nodeRunId) {
    return apiFetch(`/workflow/node-run/${nodeRunId}`, { apiKey, method: 'DELETE' });
}

export async function getNodeStatus(apiKey, runId) {
    return apiFetch(`/workflow/run/${runId}/status`, { apiKey });
}

/**
 * Handle proxy requests centralizing communication logic with Local API.
 * This is used by the server-side entry points.
 */
export async function handleProxyRequest(prefix, path, method, headers, body, apiKey) {
    const url = `${BASE_URL}/${prefix}/${path}`;
    
    const finalHeaders = new Headers(headers);
    finalHeaders.delete('host');
    finalHeaders.delete('connection');
    finalHeaders.delete('content-length'); // Let fetch recalculate this for safety

    if (apiKey) {
        finalHeaders.set('x-api-key', apiKey);
    }

    try {
        const response = await fetch(url, {
            method,
            headers: finalHeaders,
            body: (method !== 'GET' && method !== 'HEAD') ? body : undefined,
            redirect: 'follow',
        });

        const contentType = response.headers.get('Content-Type') || 'application/json';
        const buffer = await response.arrayBuffer();
        
        return {
            status: response.status,
            contentType,
            data: buffer
        };
    } catch (error) {
        console.error(`Local API Proxy error for ${url}:`, error);
        throw error;
    }
}

/**
 * A centralized handler for Next.js API routes or middleware.
 */
export async function handleServerSideProxy(prefix, request, params, apiKey) {
    try {
        const slug = await params;
        const pathSegments = slug.path || [];
        const path = pathSegments.join('/');
        
        const method = request.method;
        let body = null;
        if (method !== 'GET' && method !== 'HEAD') {
            body = await request.arrayBuffer();
        }

        const { search } = new URL(request.url);
        const pathWithSearch = search ? `${path}${search}` : path;

        return await handleProxyRequest(
            prefix, 
            pathWithSearch, 
            method, 
            request.headers, 
            body, 
            apiKey
        );
    } catch (error) {
        console.error(`Server proxy failed:`, error);
        throw error;
    }
}

// Note: calculateDynamicCost was removed because it is unused
export async function registerAppInterest(apiKey, appName) {
    return apiFetch('/app/interest', { apiKey, method: 'POST', body: { app_name: appName } });
}

export async function getAppInterests(apiKey) {
    return apiFetch('/app/interests', { apiKey });
}

// Paginated past-generations list, scoped server-side to the calling identity
// (BYOK key or white-label session token) — see GET /api/v1/history.
export async function getHistory(apiKey, { cursor, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    return apiFetch(`/history?${params.toString()}`, { apiKey });
}

export async function runClipping(apiKey, params) {
    return executeGeneration('runClipping', params);
}

export async function runMotionGraphics(apiKey, params) {
    return executeGeneration('runMotionGraphics', params);
}

export async function runMotionGraphicsEdit(apiKey, params) {
    return executeGeneration('runMotionGraphicsEdit', params);
}

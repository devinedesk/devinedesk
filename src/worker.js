import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { processGenerationRequest } from './lib/services/generationService.js';
import { env } from './lib/env.js';
import { BillingService } from './lib/services/billingService.js';
const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker('generate-queue', async (job) => {
    const { action, params, userId, cost, authMethod } = job.data;
    
    console.log(`[Worker] Processing job ${job.id} for action ${action}`);
    
    // Use platform configured API keys with fallback for local dev
    const fallbackKey = env.INTERNAL_API_KEY || env.LOCAL_API_KEY || 'devinedesk-local-dev-key';
    const keys = {
        openrouterKey: env.OPENROUTER_API_KEY || fallbackKey,
        aimlapiKey: env.AIMLAPI_KEY || fallbackKey,
        goapiKey: env.GOAPI_KEY || fallbackKey,
        hfToken: env.HF_TOKEN || fallbackKey,
        falKey: env.FAL_KEY || fallbackKey,
    };

    try {
        const timeoutMs = 5 * 60 * 1000; // 5 minutes
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`Generation task timed out after ${timeoutMs}ms`)), timeoutMs);
        });
        
        let result;
        if (action === 'execute-workflow') {
            const { executeDAG } = await import('./lib/services/workflowEngine.js');
            await executeDAG(job.data.runId, params.workflow, params.inputs, userId);
            result = { status: 'completed' };
        } else if (action === 'agent_chat') {
            const { AgentService } = await import('./lib/services/agentService.js');
            result = await AgentService.processAgentChat(params, keys, userId);
        } else {
            result = await Promise.race([
                processGenerationRequest(action, params, keys),
                timeoutPromise
            ]);
        }
        
        clearTimeout(timeoutId);

        // Extract result URL if possible
        let resultUrlStr = '';
        if (result) {
            if (typeof result === 'string') {
                resultUrlStr = result;
            } else if (result.url) {
                resultUrlStr = result.url;
            } else if (result.outputs && result.outputs.length > 0) {
                resultUrlStr = result.outputs[0];
            } else if (result.output && result.output.length > 0) {
                resultUrlStr = result.output[0];
            }
        }

        // Finalize transaction on success
        if (authMethod === 'session' && userId) {
            await BillingService.finalizeSuccessfulGeneration(userId, action, params?.prompt, params?.model, params, resultUrlStr);
        }
        
        return result;
    } catch (error) {
        console.error(`[Worker] Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}):`, error);
        
        // Only refund on the final attempt
        if (job.attemptsMade === job.opts.attempts) {
            if (authMethod === 'session' && userId) {
                await BillingService.refundFailedGeneration(userId, cost, action, params?.prompt, params?.model, params);
            }
        }
        
        throw error;
    }
}, { connection, concurrency: 5 });

worker.on('completed', job => {
    console.log(`[Worker] Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`[Worker] Job ${job.id} has failed with ${err.message}`);
});

console.log("[Worker] Started listening for jobs on generate-queue");

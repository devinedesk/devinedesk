import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { processGenerationRequest } from './services/generationService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });

const worker = new Worker('generate-queue', async (job) => {
    const { action, params, userId, cost, authMethod } = job.data;
    
    console.log(`[Worker] Processing job ${job.id} for action ${action}`);
    
    // Only use platform configured API keys
    const keys = {
        openrouterKey: process.env.OPENROUTER_API_KEY,
        aimlapiKey: process.env.AIMLAPI_KEY,
        goapiKey: process.env.GOAPI_KEY,
        hfToken: process.env.HF_TOKEN,
        falKey: process.env.FAL_KEY,
    };

    try {
        const result = await processGenerationRequest(action, params, keys);

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
            await prisma.$transaction([
                prisma.transaction.create({
                    data: {
                        userId: userId,
                        amount: -cost,
                        type: 'usage',
                        description: `Generation usage: ${action}`,
                    }
                }),
                prisma.notification.create({
                    data: {
                        userId: userId,
                        title: 'Generation Complete',
                        message: `Your ${action} request has finished. (-${cost} credits)`,
                        type: 'success'
                    }
                }),
                prisma.generation.create({
                    data: {
                        userId: userId,
                        type: action,
                        prompt: params?.prompt || '',
                        model: params?.model || action,
                        parameters: JSON.stringify(params),
                        resultUrl: resultUrlStr,
                        status: 'completed'
                    }
                })
            ]);
        }
        
        return result;
    } catch (error) {
        console.error(`[Worker] Job ${job.id} failed:`, error);
        
        // Refund on failure
        if (authMethod === 'session' && userId) {
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: userId },
                    data: { credits: { increment: cost } }
                }),
                prisma.transaction.create({
                    data: {
                        userId: userId,
                        amount: cost,
                        type: 'refund',
                        description: `Refund for failed generation: ${action}`,
                    }
                }),
                prisma.notification.create({
                    data: {
                        userId: userId,
                        title: 'Generation Failed',
                        message: `Your ${action} request failed. (+${cost} credits refunded)`,
                        type: 'error'
                    }
                }),
                prisma.generation.create({
                    data: {
                        userId: userId,
                        type: action,
                        prompt: params?.prompt || '',
                        model: params?.model || action,
                        parameters: JSON.stringify(params),
                        resultUrl: '',
                        status: 'failed'
                    }
                })
            ]);
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

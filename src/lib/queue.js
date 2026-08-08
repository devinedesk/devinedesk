import { Queue } from 'bullmq';
import IORedis from 'ioredis';

import { env } from './env.js';

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 3) return null; // stop retrying in build environments
    return Math.min(times * 50, 2000);
  },
});

export const generateQueue = new Queue('generate-queue', { connection });
export const webhookQueue = new Queue('webhook-queue', { connection });

export class QueueService {
  static async addGenerationJob(data) {
    return generateQueue.add('generate', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  static async addWorkflowJob(data) {
    return generateQueue.add(
      'workflow',
      {
        action: 'execute-workflow',
        params: { workflow: data.workflow, inputs: data.inputs },
        userId: data.userId,
        runId: data.runId,
        cost: 0, // Node costs handled internally by workflowEngine
        authMethod: 'api-key',
      },
      { attempts: 1 }
    ); // Workflows shouldn't automatically retry on crash
  }

  static async addWebhookJob(data) {
    return webhookQueue.add('webhook', data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
}

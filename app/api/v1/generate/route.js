import { NextResponse } from 'next/server';
import { BillingService } from '@/src/lib/services/billingService';
import { QueueService } from '@/src/lib/queue';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { withApiAuth } from '@/src/lib/apiHandler';

const generateSchema = z.object({
  prompt: z.string().min(1, 'Missing required parameter: prompt'),
  model: z.string().optional(),
  parameters: z.record(z.any()).optional().default({}),
  type: z.string().optional().default('t2i'),
});

export const POST = withApiAuth({
  schema: generateSchema,
  handler: async (req, { auth, body }) => {
    try {
      const { prompt, model, parameters, type } = body;

      // Calculate cost (simplified logic)
      let cost = 1; // Default
      if (type === 'video') cost = 5;
      if (type === 'lipsync') cost = 3;

      // Check and deduct credits (Will throw if insufficient)
      await BillingService.queueGeneration(auth.user.id, cost, type);

      // Push to BullMQ Worker Queue
      const jobId = randomUUID();
      await QueueService.addGenerationJob({
        jobId,
        userId: auth.user.id,
        action: type,
        params: { prompt, model: model || 'default', ...parameters },
        cost,
        authMethod: auth.method,
      });

      // Return immediate acknowledgement
      return NextResponse.json(
        {
          jobId,
          status: 'queued',
          message: 'Job successfully queued. Result will be sent to registered webhooks.',
          cost,
        },
        { status: 202 }
      );
    } catch (error) {
      if (error.message && error.message.includes('Insufficient credits')) {
        return NextResponse.json({ error: error.message }, { status: 402 }); // Payment Required
      }
      console.error('Public API Generate Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

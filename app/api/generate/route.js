import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { z } from 'zod';
import { BillingService } from '@/src/lib/services/billingService';
import { RateLimitService } from '@/src/lib/services/rateLimitService';

const COST_MAP = {
  'flux-schnell': 5,
  'flux-pro': 15,
  'video-gen': 50,
  default: 10,
};

// Define the expected schema for the generate payload
const generateSchema = z.object({
  action: z.string().min(1),
  params: z
    .object({
      prompt: z.string().optional(),
      model: z.string().optional(),
      // other params can be arbitrary depending on the model, so we allow pass-through
    })
    .passthrough()
    .optional()
    .default({}),
});

export const POST = withApiAuth({
  schema: generateSchema,
  handler: async (request, { auth, body }) => {
    // Enforce strict rate limiting (max 10 requests per minute)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const identifier = auth.method === 'session' ? auth.user.id : ip;

    const isLimited = await RateLimitService.isRateLimited(`generate:${identifier}`, 10, 60);
    if (isLimited) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before generating again.' },
        { status: 429 }
      );
    }
    const { action, params } = body;

    // Priority 1: Match specific model ID
    // Priority 2: Match action (e.g. video-gen)
    // Priority 3: Default cost
    let cost = COST_MAP['default'];
    if (params?.model && COST_MAP[params.model]) {
      cost = COST_MAP[params.model];
    } else if (COST_MAP[action]) {
      cost = COST_MAP[action];
    }

    // If it's a web user, verify credits and deduct immediately to prevent spam
    if (auth.method === 'session') {
      try {
        await BillingService.queueGeneration(auth.user.id, cost, action);
      } catch (err) {
        const status = err.message.includes('User not found') ? 404 : 402;
        return NextResponse.json({ error: err.message }, { status });
      }
    }

    const { generateQueue } = await import('@/src/lib/queue');
    const job = await generateQueue.add(
      'generate',
      {
        action,
        params,
        userId: auth.method === 'session' ? auth.user.id : null,
        cost,
        authMethod: auth.method,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    return NextResponse.json({ jobId: job.id, status: 'queued' });
  },
});

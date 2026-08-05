import { NextResponse } from 'next/server';
import { processGenerationRequest } from '@/src/services/generationService.js';
import { validateRequest } from '../auth-check';
import prisma from '@/src/lib/prisma';

// Define cost per generation action
const COST_MAP = {
    'flux-schnell': 5,
    'flux-pro': 15,
    'video-gen': 50,
    'default': 10
};

export async function POST(request) {
    try {
        const auth = await validateRequest(request);
        if (!auth.authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, params } = body;
        
        let cost = COST_MAP[action] || COST_MAP['default'];

        // If it's a web user, verify credits
        if (auth.method === 'session') {
            const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            if (user.credits < cost) {
                return NextResponse.json({ error: 'Insufficient credits. Please top up.' }, { status: 402 });
            }
        }

        // Extract possible keys from headers, fallback to process.env
        const keys = {
            openrouterKey: request.headers.get('x-openrouter-key') || process.env.OPENROUTER_API_KEY,
            aimlapiKey: request.headers.get('x-aimlapi-key') || process.env.AIMLAPI_KEY,
            goapiKey: request.headers.get('x-goapi-key') || process.env.GOAPI_KEY,
            hfToken: request.headers.get('x-hf-token') || process.env.HF_TOKEN,
            falKey: request.headers.get('x-fal-key') || process.env.FAL_KEY,
        };

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

        // Decrement credits on success
        if (auth.method === 'session') {
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: auth.user.id },
                    data: { credits: { decrement: cost } }
                }),
                prisma.transaction.create({
                    data: {
                        userId: auth.user.id,
                        amount: -cost,
                        type: 'usage',
                        description: `Generation usage: ${action}`,
                    }
                }),
                prisma.notification.create({
                    data: {
                        userId: auth.user.id,
                        title: 'Generation Complete',
                        message: `Your ${action} request has finished. (-${cost} credits)`,
                        type: 'success'
                    }
                }),
                prisma.generation.create({
                    data: {
                        userId: auth.user.id,
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

        return NextResponse.json(result);
    } catch (error) {
        console.error("API Generate Route Error:", error);
        return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
    }
}

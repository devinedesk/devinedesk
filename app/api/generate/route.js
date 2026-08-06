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

        // If it's a web user, verify credits and deduct immediately to prevent spam
        if (auth.method === 'session') {
            const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            if (user.credits < cost) {
                return NextResponse.json({ error: 'Insufficient credits. Please top up.' }, { status: 402 });
            }
            
            // Deduct immediately. (Worker will refund if job fails)
            await prisma.user.update({
                where: { id: auth.user.id },
                data: { credits: { decrement: cost } }
            });
        }

        const { generateQueue } = await import('@/src/lib/queue');
        const job = await generateQueue.add('generate', {
            action,
            params,
            userId: auth.method === 'session' ? auth.user.id : null,
            cost,
            authMethod: auth.method
        });

        return NextResponse.json({ jobId: job.id, status: 'queued' });
    } catch (error) {
        console.error("API Generate Route Error:", error);
        return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
    }
}

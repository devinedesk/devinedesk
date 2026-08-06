import { NextResponse } from 'next/server';
import { generateQueue } from '@/src/lib/queue';
import { validateRequest } from '../../auth-check';

export async function GET(request, { params }) {
    try {
        const auth = await validateRequest(request);
        if (!auth.authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { jobId } = await params;
        
        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        const job = await generateQueue.getJob(jobId);
        
        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        const state = await job.getState();
        
        if (state === 'completed') {
            return NextResponse.json({ status: 'completed', result: job.returnvalue });
        } else if (state === 'failed') {
            return NextResponse.json({ status: 'failed', error: job.failedReason }, { status: 500 });
        } else {
            return NextResponse.json({ status: state, progress: job.progress });
        }
    } catch (error) {
        console.error("API Generate Status Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to get job status' }, { status: 500 });
    }
}

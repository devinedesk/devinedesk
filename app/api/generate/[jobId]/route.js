import { NextResponse } from 'next/server';
import { generateQueue } from '@/src/lib/queue';
import { withApiAuth } from '@/src/lib/apiHandler';
import { z } from 'zod';

const jobSchema = z.object({
    jobId: z.string().min(1)
});

export const GET = withApiAuth({
    handler: async (request, { params }) => {
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
    }
});

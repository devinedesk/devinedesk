import { NextResponse } from 'next/server';
import { validateRequest } from '../../auth-check';
import prisma from '@/src/lib/prisma';

export async function GET(request) {
    const auth = await validateRequest(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const interests = await prisma.appInterest.findMany({
            where: { userId: auth.user.id },
            orderBy: { createdAt: 'desc' }
        });

        // The UI expects an array of app names
        return NextResponse.json(interests.map(i => i.appName));
    } catch (error) {
        console.error('Fetch app interests err:', error);
        return NextResponse.json({ error: 'Failed to fetch app interests' }, { status: 500 });
    }
}

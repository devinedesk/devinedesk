import { NextResponse } from 'next/server';
import { validateRequest } from '../auth-check';
import prisma from '@/src/lib/prisma';

export async function GET(request) {
    const auth = await validateRequest(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const history = await prisma.generation.findMany({
            where: { userId: auth.user.id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(history);
    } catch (error) {
        console.error('Fetch history err:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

// POST method removed: History generation records are now created securely in the /api/generate route during credit deduction.

export async function DELETE(request) {
    const auth = await validateRequest(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            await prisma.generation.deleteMany({
                where: { id, userId: auth.user.id }
            });
        } else {
            // Delete all for user
            await prisma.generation.deleteMany({
                where: { userId: auth.user.id }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete history err:', error);
        return NextResponse.json({ error: 'Failed to delete history' }, { status: 500 });
    }
}

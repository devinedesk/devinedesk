import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET(request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Missing x-user-id' }, { status: 400 });

    try {
        const history = await prisma.generation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(history);
    } catch (error) {
        console.error('Fetch history err:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

export async function POST(request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Missing x-user-id' }, { status: 400 });

    try {
        const body = await request.json();
        
        // Ensure user exists
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId, name: 'Local User' }
        });

        const newGen = await prisma.generation.create({
            data: {
                userId,
                type: body.type || 'unknown',
                prompt: body.prompt || '',
                model: body.model || '',
                parameters: body.parameters ? JSON.stringify(body.parameters) : null,
                resultUrl: body.resultUrl || '',
                status: body.status || 'completed'
            }
        });
        return NextResponse.json(newGen);
    } catch (error) {
        console.error('Save history err:', error);
        return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Missing x-user-id' }, { status: 400 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            await prisma.generation.deleteMany({
                where: { id, userId }
            });
        } else {
            // Delete all for user
            await prisma.generation.deleteMany({
                where: { userId }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete history err:', error);
        return NextResponse.json({ error: 'Failed to delete history' }, { status: 500 });
    }
}

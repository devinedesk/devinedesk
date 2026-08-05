import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET(request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Missing x-user-id' }, { status: 400 });

    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');
        if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

        const setting = await prisma.setting.findUnique({
            where: {
                userId_key: { userId, key }
            }
        });

        return NextResponse.json({ value: setting ? setting.value : null });
    } catch (error) {
        console.error('Fetch state err:', error);
        return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 });
    }
}

export async function POST(request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Missing x-user-id' }, { status: 400 });

    try {
        const { key, value } = await request.json();
        
        // Ensure user exists
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId, name: 'Local User' }
        });

        await prisma.setting.upsert({
            where: {
                userId_key: { userId, key }
            },
            update: { value },
            create: { userId, key, value }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Save state err:', error);
        return NextResponse.json({ error: 'Failed to save state' }, { status: 500 });
    }
}

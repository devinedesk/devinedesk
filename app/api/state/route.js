import { NextResponse } from 'next/server';
import { validateRequest } from '../auth-check';
import prisma from '@/src/lib/prisma';

export async function GET(request) {
    const auth = await validateRequest(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');
        if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

        const setting = await prisma.setting.findUnique({
            where: {
                userId_key: { userId: auth.user.id, key }
            }
        });

        return NextResponse.json({ value: setting ? setting.value : null });
    } catch (error) {
        console.error('Fetch state err:', error);
        return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = await validateRequest(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { key, value } = await request.json();

        await prisma.setting.upsert({
            where: {
                userId_key: { userId: auth.user.id, key }
            },
            update: { value },
            create: { userId: auth.user.id, key, value }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Save state err:', error);
        return NextResponse.json({ error: 'Failed to save state' }, { status: 500 });
    }
}

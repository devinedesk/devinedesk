import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET(request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
        return NextResponse.json({ error: 'Missing x-user-id header' }, { status: 400 });
    }

    try {
        const settings = await prisma.setting.findMany({
            where: { userId }
        });

        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        return NextResponse.json(settingsMap);
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
        return NextResponse.json({ error: 'Missing x-user-id header' }, { status: 400 });
    }

    try {
        const body = await request.json();
        
        // Ensure user exists
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId, name: 'Local User' }
        });

        // Upsert all settings in a transaction
        const updates = Object.entries(body).map(([key, value]) => {
            if (value === null || value === undefined || value.trim() === '') {
                // Delete if empty
                return prisma.setting.deleteMany({
                    where: { userId, key }
                });
            }
            return prisma.setting.upsert({
                where: {
                    userId_key: { userId, key }
                },
                update: { value: value.trim() },
                create: { userId, key, value: value.trim() }
            });
        });

        await prisma.$transaction(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { validateRequest } from '../auth-check';
import prisma from '@/src/lib/prisma';

export async function GET(request) {
    const auth = await validateRequest(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const settings = await prisma.setting.findMany({
            where: { userId: auth.user.id }
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
    const auth = await validateRequest(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        
        // Upsert all settings in a transaction
        const updates = Object.entries(body).map(([key, value]) => {
            if (value === null || value === undefined || value.trim() === '') {
                // Delete if empty
                return prisma.setting.deleteMany({
                    where: { userId: auth.user.id, key }
                });
            }
            return prisma.setting.upsert({
                where: {
                    userId_key: { userId: auth.user.id, key }
                },
                update: { value: value.trim() },
                create: { userId: auth.user.id, key, value: value.trim() }
            });
        });

        await prisma.$transaction(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

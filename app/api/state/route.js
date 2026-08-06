import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { z } from 'zod';
import { SettingsService } from '@/src/lib/services/settingsService';

export const GET = withApiAuth({
    handler: async (request, { auth }) => {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');
        if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

        const value = await SettingsService.getSetting(auth.user.id, key);

        return NextResponse.json({ value });
    }
});

const stateSchema = z.object({
    key: z.string().min(1).max(255),
    value: z.string().max(5000)
});

export const POST = withApiAuth({
    schema: stateSchema,
    handler: async (request, { auth, body }) => {
        const { key, value } = body;

        await SettingsService.saveSetting(auth.user.id, key, value);

        return NextResponse.json({ success: true });
    }
});

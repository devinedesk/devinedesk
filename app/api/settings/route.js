import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { SettingsService } from '@/src/lib/services/settingsService';
import { z } from 'zod';

export const GET = withApiAuth({
    handler: async (request, { auth }) => {
        const settingsMap = await SettingsService.getSettings(auth.user.id);
        return NextResponse.json(settingsMap);
    }
});

const settingsSchema = z.record(
    z.string().max(5000)
    .or(z.number())
    .or(z.boolean())
    .nullable()
    .optional()
);

export const POST = withApiAuth({
    schema: settingsSchema,
    handler: async (request, { auth, body }) => {
        await SettingsService.saveSettings(auth.user.id, body);
        return NextResponse.json({ success: true });
    }
});

import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { z } from 'zod';
import { NotificationService } from '@/src/lib/services/notificationService';

export const GET = withApiAuth({
    handler: async (request, { auth }) => {
        const notifications = await NotificationService.getUnreadNotifications(auth.user.id);

        return NextResponse.json(notifications);
    }
});

const markReadSchema = z.object({
    ids: z.array(z.string()).optional()
}).nullable().optional();

export const POST = withApiAuth({
    schema: markReadSchema,
    handler: async (request, { auth, body }) => {
        // Mark specific notifications as read, or all if no body provided
        if (body?.ids && Array.isArray(body.ids)) {
            await NotificationService.markAsRead(auth.user.id, body.ids);
        } else {
            await NotificationService.markAsRead(auth.user.id);
        }
        return NextResponse.json({ success: true });
    }
});

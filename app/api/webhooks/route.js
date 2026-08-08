import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';
import crypto from 'crypto';
import { z } from 'zod';

const createWebhookSchema = z.object({
  url: z
    .string()
    .url()
    .refine((val) => val.startsWith('https://'), {
      message: 'Invalid URL. Must be HTTPS.',
    }),
  events: z.array(z.string()).min(1, 'Must subscribe to at least one event.'),
});

export const GET = withApiAuth({
  handler: async (req, { auth }) => {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: { userId: auth.user.id },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ webhooks });
    } catch (error) {
      console.error('Fetch webhooks error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
});

export const POST = withApiAuth({
  schema: createWebhookSchema,
  handler: async (req, { auth, body }) => {
    try {
      const { url, events } = body;

      const secret = 'whsec_' + crypto.randomBytes(32).toString('hex');

      const webhook = await prisma.webhook.create({
        data: {
          userId: auth.user.id,
          url,
          secret,
          events: JSON.stringify(events),
          isActive: true,
        },
      });

      return NextResponse.json({ webhook }, { status: 201 });
    } catch (error) {
      console.error('Create webhook error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
});

export const DELETE = withApiAuth({
  handler: async (req, { auth }) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 });
      }

      // Ensure the webhook belongs to the user before deleting
      await prisma.webhook.deleteMany({
        where: {
          id: id,
          userId: auth.user.id,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete webhook error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
});

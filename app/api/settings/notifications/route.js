import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';

const notificationSchema = z.object({
  notify_email: z.boolean(),
  notify_push: z.boolean(),
});

export async function GET(request) {
  const ip = request?.headers?.get('x-forwarded-for') ?? '127.0.0.1';
  const rateLimit = await checkRateLimit(`${ip}_api`, 'FREE'); // Default to free tier globally
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.setting.findMany({
      where: {
        userId: session.user.id,
        key: {
          in: ['notify_email', 'notify_push'],
        },
      },
    });

    const preferences = {
      notify_email: true, // defaults
      notify_push: true,
    };

    settings.forEach((setting) => {
      preferences[setting.key] = setting.value === 'true';
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Fetch Notification Settings Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = notificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { notify_email, notify_push } = parsed.data;

    // Upsert the keys
    await prisma.$transaction([
      prisma.setting.upsert({
        where: {
          userId_key: {
            userId: session.user.id,
            key: 'notify_email',
          },
        },
        update: { value: String(notify_email) },
        create: { userId: session.user.id, key: 'notify_email', value: String(notify_email) },
      }),
      prisma.setting.upsert({
        where: {
          userId_key: {
            userId: session.user.id,
            key: 'notify_push',
          },
        },
        update: { value: String(notify_push) },
        create: { userId: session.user.id, key: 'notify_push', value: String(notify_push) },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update Notification Settings Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

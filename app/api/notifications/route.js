import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/src/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id, read: false },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Notifications Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
    }

    const notification = await prisma.notification.update({
      where: { id, userId: session.user.id },
      data: { read: true }
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Notifications Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// For internal server-to-server or Admin use
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    // Allow if admin or if we have a secret server key (for now just require admin)
    // For services (like generationService) we will bypass the route and use prisma directly.
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, title, message, type } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'info'
      }
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Notifications POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

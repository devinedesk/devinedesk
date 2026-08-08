import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function POST(req) {
  const ip = req?.headers?.get('x-forwarded-for') ?? '127.0.0.1';
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
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    if (new Date() > verificationToken.expires) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    // Update the user
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the token so it can't be used again
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({ success: true, message: 'Email successfully verified.' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

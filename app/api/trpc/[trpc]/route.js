import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';

// In a production environment, this would initialize the tRPC Next.js API handler.
// Example:
// import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
// import { appRouter } from '@/src/trpc/router';
// import { createContext } from '@/src/trpc/context';

export async function GET(req) {
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

  return NextResponse.json(
    {
      message: 'tRPC API is scaffolded.',
      documentation: '/docs/api/trpc',
      status: 501,
    },
    { status: 501 }
  );
}

export async function POST(req) {
  return NextResponse.json(
    {
      message: 'tRPC API is scaffolded.',
      documentation: '/docs/api/trpc',
      status: 501,
    },
    { status: 501 }
  );
}

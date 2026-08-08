import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { ratelimit } from './lib/rate-limit';

function addSecurityHeaders(response, request) {
  // Prevent MIME type sniffing (CWE-693)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking (CWE-1021)
  response.headers.set('X-Frame-Options', 'DENY');
  // Enable XSS filter in legacy browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict Transport Security (HSTS)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  const isDev = process.env.NODE_ENV === 'development';

  // Strict CSP: Remove unsafe-eval in production.
  // Next.js requires unsafe-inline for scripts unless nonces are used.
  const scriptSrc = isDev ? "'self' 'unsafe-eval' 'unsafe-inline'" : "'self' 'unsafe-inline'";

  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https: http: wss: ws:; font-src 'self' data: https://fonts.gstatic.com;`
  );

  // CORS headers for API routes
  if (request?.nextUrl?.pathname?.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  }

  return response;
}

export default withAuth(
  async function middleware(request) {
    if (request.nextUrl.pathname.startsWith('/api') && request.method === 'OPTIONS') {
      return addSecurityHeaders(new NextResponse(null, { status: 200 }), request);
    }

    if (request.nextUrl.pathname.startsWith('/api')) {
      try {
        const ip = request.ip ?? '127.0.0.1';
        const { success, pending, limit, reset, remaining } = await ratelimit.limit(
          `ratelimit_${ip}`
        );

        if (!success) {
          return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
              'Content-Type': 'application/json',
            },
          });
        }
      } catch (err) {
        // If redis is down, just proceed to not break the app
        console.error('Rate limit error', err);
      }
    }

    return addSecurityHeaders(NextResponse.next(), request);
  },
  {
    callbacks: {
      authorized: async ({ req, token }) => {
        const path = req.nextUrl.pathname;

        // API routes handle their own auth via withApiAuth (API key or session)
        if (path.startsWith('/api')) {
          return true;
        }

        // Protect Admin routes
        if (path.startsWith('/admin')) {
          return token?.role === 'ADMIN' || token?.role === 'SUPER_ADMIN';
        }

        // Protect user routes
        if (
          path.startsWith('/dashboard') ||
          path.startsWith('/settings') ||
          path.startsWith('/billing') ||
          path.startsWith('/studio')
        ) {
          return !!token;
        }

        // Default allow, specific page protections are handled by layout files if needed
        return true;
      },
    },
    pages: {
      signIn: '/auth/login',
    },
  }
);

// Match all paths for security headers. Exclude Next.js internal paths.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|__nextjs_original-stack-frame).*)'],
};

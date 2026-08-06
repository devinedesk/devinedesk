import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

function addSecurityHeaders(response, request) {
    // Prevent MIME type sniffing (CWE-693)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // Prevent clickjacking (CWE-1021)
    response.headers.set('X-Frame-Options', 'DENY');
    // Enable XSS filter in legacy browsers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    const __impeccableLiveDev = process.env.NODE_ENV === "development" ? " http://localhost:8400" : "";
    response.headers.set(
        'Content-Security-Policy',
        `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'${__impeccableLiveDev}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https: http: wss: ws:${__impeccableLiveDev}; font-src 'self' data: https://fonts.gstatic.com;`
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
    function middleware(request) {
        if (request.method === 'OPTIONS' && request.nextUrl.pathname.startsWith('/api')) {
            return addSecurityHeaders(new NextResponse(null, { status: 200 }), request);
        }
        return addSecurityHeaders(NextResponse.next(), request);
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                const path = req.nextUrl.pathname;

                // API routes handle their own auth via withApiAuth (API key or session)
                if (path.startsWith('/api')) {
                    return true;
                }

                // Protect Admin routes
                if (path.startsWith('/admin')) {
                    return token?.role === 'ADMIN';
                }

                // Default allow, specific page protections are handled by layout files if needed
                return true;
            }
        }
    }
);

// Match all paths for security headers. Exclude Next.js internal paths.
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|__nextjs_original-stack-frame).*)',
    ],
};

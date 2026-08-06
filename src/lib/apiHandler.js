import { NextResponse } from 'next/server';
import { validateRequest } from '@/app/api/auth-check';
import { z } from 'zod';
import { RateLimitService } from '@/src/lib/services/rateLimitService';

/**
 * A wrapper for API routes to standardize authentication, validation, and error handling.
 * 
 * @param {Object} options
 * @param {z.ZodSchema} [options.schema] - Optional Zod schema to validate request body
 * @param {Function} options.handler - The main route handler: (req, { auth, body, params }) => Promise<NextResponse>
 * @returns {Function} Next.js route handler
 */
export function withApiAuth({ schema, handler, requireAuth = true, requireAdmin = false }) {
    return async (request, context) => {
        try {
            // 1. Check Authentication
            const auth = await validateRequest(request);
            if (requireAuth && !auth.authorized) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            if (requireAdmin && auth.user?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
            }

            // Rate Limiting (60 requests per minute)
            const identifier = auth.user?.id || request.headers.get('x-forwarded-for') || 'anonymous';
            const isLimited = await RateLimitService.isRateLimited(identifier, 60, 60);
            if (isLimited) {
                return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
            }

            // CSRF Protection for state-changing requests using session authentication
            if (auth.method === 'session' && request.method !== 'GET' && request.method !== 'HEAD') {
                const origin = request.headers.get('origin') || request.headers.get('referer');
                const host = request.headers.get('host');
                if (origin && host) {
                    try {
                        const originUrl = new URL(origin);
                        if (originUrl.host !== host) {
                            return NextResponse.json({ error: 'CSRF validation failed: Origin mismatch' }, { status: 403 });
                        }
                    } catch (e) {
                        return NextResponse.json({ error: 'CSRF validation failed: Invalid Origin' }, { status: 403 });
                    }
                }
            }

            // 2. Parse and Validate Body
            let body = null;
            if (request.method !== 'GET' && request.method !== 'HEAD') {
                const contentType = request.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    try {
                        body = await request.json();
                    } catch (e) {
                        if (schema) {
                            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
                        }
                    }
                }
            }

            if (schema && body) {
                const validation = schema.safeParse(body);
                if (!validation.success) {
                    return NextResponse.json(
                        { 
                            error: 'Validation failed', 
                            details: validation.error.format() 
                        }, 
                        { status: 400 }
                    );
                }
                body = validation.data; // use the validated/stripped data
            }

            // 3. Execute Handler
            return await handler(request, { auth, body, ...context });
        } catch (error) {
            console.error('[API Error]:', error);
            return NextResponse.json(
                { error: error.message || 'Internal Server Error' }, 
                { status: 500 }
            );
        }
    };
}

import { NextResponse } from 'next/server';
import { validateRequest } from '@/src/lib/auth-check';
import { z } from 'zod';
import { RateLimitService } from '@/src/lib/services/rateLimitService';
import * as Sentry from '@sentry/nextjs';

/**
 * A wrapper for API routes to standardize authentication, validation, and error handling.
 *
 * @param {Object} options
 * @param {z.ZodSchema} [options.schema] - Optional Zod schema to validate request body
 * @param {Function} options.handler - The main route handler: (req, { auth, body, params }) => Promise<NextResponse>
 * @param {boolean} [options.requireAuth=true]
 * @param {boolean} [options.requireAdmin=false]
 * @param {number} [options.rateLimitOverride=null]
 * @returns {Function} Next.js route handler
 */
export function withApiAuth({ schema, handler, requireAuth = true, requireAdmin = false, rateLimitOverride = null }) {
  return async (request, context) => {
    try {
      // 1. Check Authentication
      const auth = await validateRequest(request);
      if (requireAuth && !auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
      }

      // Global Account Suspension Check
      if (auth.user?.role === 'BANNED') {
        return NextResponse.json(
          { error: 'Account Suspended', code: 'ACCOUNT_SUSPENDED' },
          { status: 403 }
        );
      }

      if (requireAdmin && auth.user?.role !== 'ADMIN' && auth.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      // 1.5 Rate Limiting
      let limit = 60; // default for authenticated users
      if (rateLimitOverride !== null) {
        limit = rateLimitOverride;
      } else if (!auth.user) {
        limit = 20; // stricter limit for anonymous
      } else if (auth.user.role === 'SUPER_ADMIN') {
        limit = 1000;
      } else if (auth.user.role === 'ADMIN') {
        limit = 300;
      }

      const identifier = auth.user?.id || request.headers.get('x-forwarded-for') || 'anonymous';
      const isLimited = await RateLimitService.isRateLimited(identifier, limit, 60);
      if (isLimited) {
        return NextResponse.json(
          { error: 'Too Many Requests', code: 'RATE_LIMIT_EXCEEDED' },
          { status: 429 }
        );
      }

      // CSRF Protection for state-changing requests using session authentication
      if (auth.method === 'session' && request.method !== 'GET' && request.method !== 'HEAD') {
        const origin = request.headers.get('origin') || request.headers.get('referer');
        const host = request.headers.get('host');
        if (origin && host) {
          try {
            const originUrl = new URL(origin);
            if (originUrl.host !== host) {
              return NextResponse.json(
                { error: 'CSRF validation failed: Origin mismatch', code: 'CSRF_FAILED' },
                { status: 403 }
              );
            }
          } catch (e) {
            return NextResponse.json(
              { error: 'CSRF validation failed: Invalid Origin', code: 'CSRF_FAILED' },
              { status: 403 }
            );
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
              return NextResponse.json(
                { error: 'Invalid JSON body', code: 'INVALID_JSON' },
                { status: 400 }
              );
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
              code: 'VALIDATION_FAILED',
              details: validation.error.format(),
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
      Sentry.captureException(error);
      return NextResponse.json(
        { error: error.message || 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' },
        { status: 500 }
      );
    }
  };
}

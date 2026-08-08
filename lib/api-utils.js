import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standardized API Error Response
 */
export function apiError(message, status = 400, code = 'BAD_REQUEST', details = null) {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

/**
 * Standardized API Success Response
 */
export function apiSuccess(data, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Wrapper for API routes to handle standard try/catch and Zod validation errors
 * @param {Function} handler - The async route handler function
 */
export function withApiHandler(handler) {
  return async (req, ...args) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error('[API_ERROR]', error);

      if (error instanceof ZodError) {
        return apiError('Validation Error', 400, 'VALIDATION_FAILED', error.errors);
      }

      if (error.name === 'PrismaClientKnownRequestError') {
        if (error.code === 'P2002') {
          return apiError('A record with this value already exists.', 409, 'CONFLICT');
        }
      }

      return apiError('Internal Server Error', 500, 'INTERNAL_ERROR');
    }
  };
}

/**
 * Validates request JSON body against a Zod schema
 */
export async function validateBody(req, schema) {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    // If it fails to parse JSON, throw a custom Zod error or standard error
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON body');
    }
    throw error; // Let withApiHandler catch ZodError
  }
}

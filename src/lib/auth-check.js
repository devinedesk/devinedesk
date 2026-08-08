import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { env } from '@/src/lib/env';
import prisma from '@/src/lib/prisma';
import { createHash } from 'crypto';

/**
 * Validates either a valid NextAuth session OR a database-backed API key.
 * @param {Request} request
 * @returns {Promise<Object>}
 */
export async function validateRequest(request) {
  // 1. Check Session (Web UI)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    // Optionally fetch full user from DB if role is needed
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) {
      return { authorized: true, user, method: 'session' };
    }
  }

  // 2. Check API Key (Desktop/Local execution or Bearer token)
  const authHeader = request.headers.get('authorization');
  let token = request.headers.get('x-api-key');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Local admin override
  const localKey = env.LOCAL_API_KEY;
  if (token === localKey && localKey) {
    return {
      authorized: true,
      user: { role: 'SUPER_ADMIN', id: 'local-admin' },
      method: 'api-key',
    };
  }

  if (token) {
    // Hash the incoming token to compare with stored SHA256 hash
    const hashedKey = createHash('sha256').update(token).digest('hex');

    const apiKey = await prisma.aPIKey.findUnique({
      where: { key: hashedKey },
      include: { user: true },
    });

    if (apiKey && (!apiKey.expiresAt || apiKey.expiresAt > new Date())) {
      // Async update last used
      prisma.aPIKey
        .update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(console.error);

      return { authorized: true, user: apiKey.user, method: 'api-key' };
    }
  }

  return { authorized: false, user: null, method: 'none' };
}

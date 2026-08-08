import prisma from '@/src/lib/prisma';

/**
 * Validates a Bearer token against the APIKey database table.
 * Updates the lastUsedAt timestamp if valid.
 *
 * @param {Request} request - The incoming Next.js Request object
 * @returns {Promise<{ isValid: boolean, userId?: string, workspaceId?: string, error?: string, status?: number }>}
 */
export async function validateApiKey(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'Missing or invalid Authorization header', status: 401 };
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return { isValid: false, error: 'Token missing', status: 401 };
  }

  try {
    // In production, the key would be hashed in the DB, so we'd hash the provided token and query.
    // For this implementation, we stored it in plain text.
    const apiKey = await prisma.aPIKey.findUnique({
      where: { key: token },
    });

    if (!apiKey) {
      return { isValid: false, error: 'Invalid API Key', status: 401 };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { isValid: false, error: 'API Key expired', status: 401 };
    }

    // Update last used timestamp (fire and forget to not block response)
    prisma.aPIKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => console.error('Failed to update API key lastUsedAt:', err));

    return {
      isValid: true,
      userId: apiKey.userId,
      workspaceId: apiKey.workspaceId,
    };
  } catch (error) {
    console.error('API Key Validation Error:', error);
    return { isValid: false, error: 'Internal server error during validation', status: 500 };
  }
}

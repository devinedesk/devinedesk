import prisma from '@/src/lib/prisma';
import { env } from '@/src/lib/env';

export class AuditService {
  /**
   * Log a security or system event.
   * @param {Object} params
   * @param {string} params.userId - The ID of the user triggering the action
   * @param {string} params.action - The action performed (e.g. 'API_KEY_CREATED', '2FA_ENABLED', 'LOGIN_FAILED')
   * @param {string} [params.resource] - The resource affected
   * @param {Object} [params.metadata] - Additional JSON data
   * @param {string} [params.ipAddress] - IP Address of the requester
   * @param {string} [params.userAgent] - User Agent of the requester
   */
  static async log(params) {
    try {
      const { userId, action, resource, metadata, ipAddress, userAgent } = params;

      return await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          metadata: metadata ? JSON.stringify(metadata) : null,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('[AuditService] Failed to create audit log:', error);
      // We intentionally don't throw to prevent audit logging failures from crashing the main flow
      return null;
    }
  }

  /**
   * Retrieve audit logs for a specific user
   */
  static async getUserLogs(userId, limit = 50) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

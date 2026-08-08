import prisma from '@/src/lib/prisma';

export class NotificationService {
  /**
   * Creates a new notification
   */
  static async notify({ userId, title, message, type = 'info', link = null }) {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          link,
          read: false,
        },
      });
    } catch (error) {
      console.error('[NotificationService] Failed to create notification:', error);
      return null;
    }
  }

  /**
   * Gets unread notifications for a user
   */
  static async getUnreadNotifications(userId) {
    if (!userId) return [];
    return prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });
  }

  /**
   * Marks specific or all notifications as read for a user
   */
  static async markAsRead(userId, ids = null) {
    if (!userId) return false;

    const whereClause = {
      userId,
      read: false,
    };

    if (ids && Array.isArray(ids)) {
      whereClause.id = { in: ids };
      // If ids are provided, we don't necessarily only want unread ones to be updated
      // though it doesn't hurt to keep `read: false` filter.
    }

    await prisma.notification.updateMany({
      where: whereClause,
      data: {
        read: true,
      },
    });

    return true;
  }
}

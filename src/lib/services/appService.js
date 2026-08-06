import prisma from '@/src/lib/prisma';

export class AppService {
    /**
     * Get all app interests for a user
     */
    static async getInterests(userId) {
        if (!userId) return [];
        return prisma.appInterest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Check if a user is interested in a specific app
     */
    static async getInterest(userId, appName) {
        if (!userId || !appName) return null;
        return prisma.appInterest.findUnique({
            where: {
                userId_appName: {
                    userId,
                    appName
                }
            }
        });
    }

    /**
     * Record a user's interest in a specific app
     */
    static async addInterest(userId, appName) {
        if (!userId || !appName) return null;
        return prisma.appInterest.upsert({
            where: {
                userId_appName: {
                    userId,
                    appName
                }
            },
            update: {}, // Do nothing if it exists
            create: {
                userId,
                appName
            }
        });
    }
}

import prisma from '@/src/lib/prisma';
import env from '@/src/lib/env';

export class AssetService {
    /**
     * Records an uploaded asset into the database
     */
    static async recordAsset(userId, fileType, url, metadata) {
        if (!userId) return null;
        
        const type = fileType.startsWith('video') ? 'video' : (fileType.startsWith('audio') ? 'audio' : 'image');

        return prisma.asset.create({
            data: {
                userId,
                type,
                url,
                metadata: JSON.stringify(metadata)
            }
        });
    }

    /**
     * Gets a user's assets
     */
    static async getUserAssets(userId, limit = 50) {
        if (!userId) return [];
        return prisma.asset.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
}

import prisma from '@/src/lib/prisma';

export class SettingsService {
    /**
     * Get all settings for a user as a key-value map
     */
    static async getSettings(userId) {
        if (!userId) return {};
        const settings = await prisma.setting.findMany({
            where: { userId }
        });
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }

    /**
     * Get a specific setting for a user
     */
    static async getSetting(userId, key) {
        if (!userId || !key) return null;
        const setting = await prisma.setting.findUnique({
            where: {
                userId_key: { userId, key }
            }
        });
        return setting ? setting.value : null;
    }

    /**
     * Save a specific setting for a user
     */
    static async saveSetting(userId, key, value) {
        if (!userId || !key) return;
        const stringValue = String(value).trim();
        await prisma.setting.upsert({
            where: {
                userId_key: { userId, key }
            },
            update: { value: stringValue },
            create: { userId, key, value: stringValue }
        });
    }

    /**
     * Upsert and delete multiple settings for a user
     */
    static async saveSettings(userId, settingsMap) {
        if (!userId || !settingsMap) return;

        const updates = Object.entries(settingsMap).map(([key, value]) => {
            if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
                // Delete if empty
                return prisma.setting.deleteMany({
                    where: { userId, key }
                });
            }
            
            const stringValue = String(value).trim();
            
            return prisma.setting.upsert({
                where: {
                    userId_key: { userId, key }
                },
                update: { value: stringValue },
                create: { userId, key, value: stringValue }
            });
        });

        await prisma.$transaction(updates);
    }
}

import prisma from '@/src/lib/prisma';

export class AdminService {
    /**
     * Gets global platform stats
     */
    static async getStats() {
        const totalUsers = await prisma.user.count();
        const totalGenerations = await prisma.generation.count();
        const transactions = await prisma.transaction.findMany();
        
        const totalPurchasedCredits = transactions
            .filter(t => t.type === 'purchase')
            .reduce((acc, t) => acc + t.amount, 0);

        const totalSpentCredits = transactions
            .filter(t => t.type === 'usage')
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);

        const recentUsers = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, name: true, email: true, createdAt: true, credits: true, role: true }
        });

        const recentTransactions = await prisma.transaction.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { user: { select: { name: true, email: true } } }
        });

        return {
            metrics: {
                totalUsers,
                totalGenerations,
                totalPurchasedCredits,
                totalSpentCredits
            },
            recentUsers,
            recentTransactions
        };
    }

    /**
     * Gets 30-day analytics data
     */
    static async getAnalytics(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const generations = await prisma.generation.findMany({
            where: { createdAt: { gte: startDate } },
            select: { createdAt: true },
        });

        const transactions = await prisma.transaction.findMany({
            where: { createdAt: { gte: startDate } },
            select: { createdAt: true, type: true, amount: true },
        });

        const groupByDay = (records, processRecord) => {
            const grouped = {};
            
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                grouped[dateStr] = processRecord ? processRecord(null, true) : 0;
            }

            records.forEach(record => {
                const dateStr = new Date(record.createdAt).toISOString().split('T')[0];
                if (grouped[dateStr] !== undefined) {
                    if (processRecord) {
                        grouped[dateStr] = processRecord(record, false, grouped[dateStr]);
                    } else {
                        grouped[dateStr] += 1;
                    }
                }
            });

            return Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, value]) => ({ date, ...value }));
        };

        const generationsData = groupByDay(generations, (record, init, prev) => {
            if (init) return { count: 0 };
            return { count: prev.count + 1 };
        }).map(d => ({ date: d.date, generations: d.count }));

        const creditsData = groupByDay(transactions, (record, init, prev) => {
            if (init) return { purchased: 0, spent: 0 };
            if (record.type === 'purchase') {
                return { ...prev, purchased: prev.purchased + record.amount };
            } else if (record.type === 'usage') {
                return { ...prev, spent: prev.spent + Math.abs(record.amount) };
            }
            return prev;
        });

        return { generationsData, creditsData };
    }
}

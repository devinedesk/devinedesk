import prisma from '@/src/lib/prisma';
import { unstable_cache } from 'next/cache';

export class AdminService {
  /**
   * Gets global platform stats with Next.js Cache
   */
  static async getStats() {
    const fetchStats = async () => {
      const totalUsers = await prisma.user.count();
      const totalGenerations = await prisma.generation.count();
      const transactions = await prisma.transaction.findMany();

      const totalPurchasedCredits = transactions
        .filter((t) => t.type === 'purchase')
        .reduce((acc, t) => acc + t.amount, 0);

      const totalSpentCredits = transactions
        .filter((t) => t.type === 'usage')
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

      const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true, credits: true, role: true },
      });

      const recentTransactions = await prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true, email: true } } },
      });

      return {
        metrics: {
          totalUsers,
          totalGenerations,
          totalPurchasedCredits,
          totalSpentCredits,
        },
        recentUsers,
        recentTransactions,
      };
    };

    const getCachedStats = unstable_cache(fetchStats, ['admin-stats-global'], { revalidate: 300 });
    return getCachedStats();
  }

  /**
   * Gets 30-day analytics data
   */
  static async getAnalytics(days = 30) {
    const fetchAnalytics = async () => {
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

        records.forEach((record) => {
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
      }).map((d) => ({ date: d.date, generations: d.count }));

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
    };

    const getCachedAnalytics = unstable_cache(fetchAnalytics, ['admin-analytics', String(days)], {
      revalidate: 3600,
    });
    return getCachedAnalytics();
  }

  /**
   * Gets paginated users list for the admin portal
   */
  static async getUsersList({ page = 1, limit = 50, search = '' }) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, credits: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Updates user role
   */
  static async updateUserRole(userId, role) {
    if (!['USER', 'ADMIN', 'DEVELOPER'].includes(role)) throw new Error('Invalid role');
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  /**
   * Ban/Unban user (soft delete / suspend)
   * Note: implementing simply by adding a flag to user in a real app,
   * but since our schema might not have 'isBanned', we'll simulate or use a setting.
   * We'll use a user setting for 'isBanned' since schema modifications require a migration.
   */
  static async setUserBanStatus(userId, isBanned) {
    return prisma.setting.upsert({
      where: { userId_key: { userId, key: 'account_banned' } },
      update: { value: isBanned ? 'true' : 'false' },
      create: { userId, key: 'account_banned', value: isBanned ? 'true' : 'false' },
    });
  }

  /**
   * Get global transactions ledger
   */
  static async getAllTransactions({ page = 1, limit = 100 }) {
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.transaction.count(),
    ]);
    return { transactions, total, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get basic system health overview
   */
  static async getSystemHealth() {
    const start = Date.now();
    let dbStatus = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'error';
    }
    const ping = Date.now() - start;

    const activeApiKeys = await prisma.aPIKey.count({
      where: { isActive: true },
    });

    const activeWorkflows = await prisma.workflow.count({
      where: { status: 'ACTIVE' },
    });

    return {
      database: { status: dbStatus, pingMs: ping },
      metrics: { activeApiKeys, activeWorkflows },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  }

  static async getFeatureFlags() {
    return prisma.featureFlag.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async toggleFeatureFlag(id) {
    const flag = await prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) throw new Error('Not found');
    return prisma.featureFlag.update({
      where: { id },
      data: { enabled: !flag.enabled },
    });
  }

  static async getAssets({ page = 1, limit = 50 }) {
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.asset.count(),
    ]);
    return { assets, total, totalPages: Math.ceil(total / limit) };
  }

  static async getSupportTickets({ page = 1, limit = 50 }) {
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.supportTicket.count(),
    ]);
    return { tickets, total, totalPages: Math.ceil(total / limit) };
  }

  static async getQueueJobs({ page = 1, limit = 50 }) {
    const [runs, total] = await Promise.all([
      prisma.workflowRun.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { workflow: { select: { name: true } } },
      }),
      prisma.workflowRun.count(),
    ]);
    return { runs, total, totalPages: Math.ceil(total / limit) };
  }

  static async getSecurityMetrics() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [auditLogs, failedLogins, activeThreats, apiKeysIssued, totalUsers, mfaUsers] = await Promise.all([
      prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      prisma.auditLog.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: last24h } } }),
      prisma.auditLog.count({ where: { action: 'SECURITY_THREAT', createdAt: { gte: last24h } } }),
      prisma.aPIKey.count(),
      prisma.user.count(),
      prisma.user.count({ where: { twoFactorEnabled: true } }),
    ]);
    const mfaAdoption = totalUsers > 0 ? Math.round((mfaUsers / totalUsers) * 100) : 0;
    return {
      auditLogs,
      activeThreats,
      failedLogins,
      mfaAdoption,
      apiKeysIssued,
    };
  }

  static async getPerformanceMetrics() {
    const os = require('os');
    const mem = process.memoryUsage();
    return {
      system: {
        cpuLoad: [os.loadavg()[0]],
        uptime: os.uptime(),
      },
      process: {
        memory: {
          heapTotal: mem.heapTotal,
          heapUsed: mem.heapUsed,
          rss: mem.rss,
        },
      },
      slowEndpoints: [],
    };
  }

  static async getOperationsMetrics() {
    const os = require('os');
    const { generateQueue, webhookQueue } = require('@/src/lib/queue');
    const pendingJobs = await prisma.workflowRun.count({ where: { status: 'PROCESSING' } });
    
    let activeWorkers = 0;
    try {
      const genWorkers = await generateQueue.getWorkers();
      const webWorkers = await webhookQueue.getWorkers();
      activeWorkers = genWorkers.length + webWorkers.length;
    } catch (e) {
      // Ignore if redis is unavailable
    }

    let dbSize = 0;
    try {
      const dbSizeResult = await prisma.$queryRaw`SELECT pg_database_size(current_database()) as size`;
      dbSize = Number(dbSizeResult[0]?.size) || 0;
    } catch (e) {
      // Ignore if unsupported db
    }

    return {
      uptime: os.uptime(),
      activeWorkers,
      totalWorkers: activeWorkers,
      pendingJobs,
      dbSize,
    };
  }
}

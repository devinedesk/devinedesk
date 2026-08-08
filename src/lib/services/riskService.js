import prisma from '@/src/lib/prisma';

export class RiskService {
  /**
   * Calculates a naive risk score and generates a Fraud Dashboard aggregate from live DB data.
   */
  static async getFraudDashboardMetrics() {
    // 1. Get recent users (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Aggregations
    const [totalUsers, totalGenerations, recentTransactions, recentGenerations, auditLogs] =
      await Promise.all([
        prisma.user.count(),
        prisma.generation.count(),
        prisma.transaction.findMany({
          where: { createdAt: { gte: twentyFourHoursAgo } },
          include: { user: true },
        }),
        prisma.generation.findMany({
          where: { createdAt: { gte: twentyFourHoursAgo }, status: 'FAILED' },
          include: { user: true },
        }),
        prisma.auditLog.findMany({
          where: { action: { in: ['BAN_USER', 'DELETE_USER'] } },
        }),
      ]);

    const bannedCount = auditLogs.length;

    // Calculate velocity / suspicious activity per user
    const userRiskMap = new Map();

    const getRiskRecord = (userId, userEmail) => {
      if (!userRiskMap.has(userId)) {
        userRiskMap.set(userId, {
          id: userId,
          user: userEmail,
          riskScore: 0,
          reason: [],
          txCount: 0,
          failedGenCount: 0,
        });
      }
      return userRiskMap.get(userId);
    };

    // Rule 1: High transaction velocity
    for (const tx of recentTransactions) {
      if (!tx.user) continue;
      const record = getRiskRecord(tx.userId, tx.user.email || 'Unknown');
      record.txCount += 1;
      if (record.txCount > 5) {
        record.riskScore = Math.min(record.riskScore + 20, 100);
        if (!record.reason.includes('High transaction velocity')) {
          record.reason.push('High transaction velocity');
        }
      }
    }

    // Rule 2: High number of FAILED generations (often indicates API probing/abuse)
    for (const gen of recentGenerations) {
      if (!gen.user) continue;
      const record = getRiskRecord(gen.userId, gen.user.email || 'Unknown');
      record.failedGenCount += 1;
      if (record.failedGenCount > 10) {
        record.riskScore = Math.min(record.riskScore + 30, 100);
        if (!record.reason.includes('High failed generation rate (API Abuse)')) {
          record.reason.push('High failed generation rate (API Abuse)');
        }
      }
    }

    // Filter to only those with a non-zero risk score, sorted by highest risk
    const flaggedTransactions = Array.from(userRiskMap.values())
      .filter((r) => r.riskScore > 0)
      .sort((a, b) => b.riskScore - a.riskScore)
      .map((r) => ({
        id: `usr_risk_${r.id.substring(0, 8)}`,
        userId: r.id,
        user: r.user,
        amount: r.txCount, // repurposed for display
        reason: r.reason.join(', '),
        riskScore: r.riskScore,
      }));

    // Generate summary stats
    const avgRiskScore =
      flaggedTransactions.length > 0
        ? Math.round(
            flaggedTransactions.reduce((acc, r) => acc + r.riskScore, 0) /
              flaggedTransactions.length
          )
        : 0;

    const blockedIps = 0;

    return {
      flaggedTransactions,
      stats: {
        highRiskScore: avgRiskScore,
        blockedIps,
        bannedAccounts: bannedCount,
        systemVelocity: recentTransactions.length > 1000 ? 'High' : 'Normal',
      },
    };
  }
}

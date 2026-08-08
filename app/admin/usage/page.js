import { Card } from '@/components/ui/Card';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { DollarSign, TrendingUp, Cpu, CreditCard, Download, Zap } from 'lucide-react';
import prisma from '@/src/lib/prisma';

export default async function CostAndUsageDashboard() {
  // Aggregate total tokens and costs
  const aggregatedUsage = await prisma.modelUsage.aggregate({
    _sum: {
      totalTokens: true,
      promptTokens: true,
      completionTokens: true,
      costInCents: true,
    },
    _count: {
      id: true,
    },
  });

  const totalCostDollars = (aggregatedUsage._sum.costInCents || 0) / 100;
  const totalTokens = aggregatedUsage._sum.totalTokens || 0;
  const promptTokens = aggregatedUsage._sum.promptTokens || 0;
  const compTokens = aggregatedUsage._sum.completionTokens || 0;
  const totalGenerations = aggregatedUsage._count.id || 0;
  const avgCostPerGen =
    totalGenerations > 0 ? (totalCostDollars / totalGenerations).toFixed(4) : '0.0000';

  // Get total MRR from purchases (approximated from transactions in this month)
  const aggregatedTransactions = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      type: 'purchase',
    },
  });

  const mrr = aggregatedTransactions._sum.amount || 0;

  // Group by model (using raw query for robust grouping, but Prisma groupBy works too)
  const modelStats = await prisma.modelUsage.groupBy({
    by: ['model'],
    _sum: {
      costInCents: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        costInCents: 'desc',
      },
    },
    take: 5,
  });

  // Top Users by Cost
  const userStats = await prisma.modelUsage.groupBy({
    by: ['userId'],
    _sum: {
      costInCents: true,
    },
    orderBy: {
      _sum: {
        costInCents: 'desc',
      },
    },
    take: 5,
  });

  // Fetch user emails for top users
  const topUserIds = userStats.map((u) => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, email: true, stripeCustomerId: true },
  });

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = {
      email: user.email,
      plan: user.stripeCustomerId ? 'Pro/Enterprise' : 'Free',
    };
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Cost & Usage Analytics
          </h2>
          <p className="text-neutral-secondary mt-1">
            Track AI model usage, token consumption, and platform costs.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Total AI Spend (All Time)</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                $
                {totalCostDollars.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <DollarSign size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Total Tokens (All Time)</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {(totalTokens / 1000000).toFixed(2)}M
              </h3>
            </div>
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
              <Cpu size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-neutral-500">
              Prompt: {(promptTokens / 1000000).toFixed(2)}M | Comp:{' '}
              {(compTokens / 1000000).toFixed(2)}M
            </span>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Avg Cost / Generation</p>
              <h3 className="text-2xl font-bold text-white mt-1">${avgCostPerGen}</h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Zap size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-neutral-500">
              Across {totalGenerations.toLocaleString()} generations
            </span>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Total Purchase Volume</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                $
                {mrr.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <CreditCard size={20} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 overflow-hidden">
          <h3 className="text-lg font-medium text-white mb-6">Cost by Model (Top 5)</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model ID</TableHead>
                  <TableHead className="text-right">Generations</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-neutral-500 py-4">
                      No model usage data available.
                    </TableCell>
                  </TableRow>
                )}
                {modelStats.map((stat) => (
                  <TableRow key={stat.model}>
                    <TableCell className="font-medium text-white">{stat.model}</TableCell>
                    <TableCell className="text-right text-neutral-300">
                      {stat._count.id.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-red-400 font-medium">
                      ${((stat._sum.costInCents || 0) / 100).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 overflow-hidden">
          <h3 className="text-lg font-medium text-white mb-6">Top Users by Cost</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-neutral-500 py-4">
                      No user usage data available.
                    </TableCell>
                  </TableRow>
                )}
                {userStats.map((stat) => {
                  const userInfo = userMap[stat.userId] || { email: stat.userId, plan: 'Unknown' };
                  return (
                    <TableRow key={stat.userId}>
                      <TableCell className="font-medium text-white text-sm">
                        {userInfo.email}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${userInfo.plan.includes('Pro') ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-neutral-400'}`}
                        >
                          {userInfo.plan}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-neutral-300">
                        ${((stat._sum.costInCents || 0) / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}

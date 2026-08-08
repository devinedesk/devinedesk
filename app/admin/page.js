import { Suspense } from 'react';
import { Card } from '@/components/ui/Card';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';
import { AdminService } from '@/src/lib/services/adminService';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { AdminDashboardSkeleton } from '@/components/admin/AdminDashboardSkeleton';

export const metadata = {
  title: 'Admin Dashboard | Devinedesk',
  description: 'Platform administration and analytics',
};

// Next.js config to ensure this route is always dynamically rendered
export const dynamic = 'force-dynamic';

async function AdminDashboardContent() {
  // Fetch all admin stats concurrently on the server
  const [stats, financeData, activityData] = await Promise.all([
    AdminService.getStats(),
    AdminService.getAnalytics(7),
    AdminService.getActivity(20),
  ]);

  return (
    <div className="space-y-8 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-white">Platform Overview</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={stats.metrics.totalUsers}
          icon="👥"
          color="from-cyan-400 to-cyan-500"
        />
        <MetricCard
          title="Total Generations"
          value={stats.metrics.totalGenerations}
          icon="⚡"
          color="from-purple-500 to-pink-500"
        />
        <MetricCard
          title="Credits Purchased"
          value={stats.metrics.totalPurchasedCredits}
          icon="💎"
          color="from-green-500 to-emerald-500"
        />
        <MetricCard
          title="Credits Spent"
          value={stats.metrics.totalSpentCredits}
          icon="🔥"
          color="from-orange-500 to-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card padding="none" className="flex flex-col">
          <div className="p-5 border-b border-muted bg-card-bg">
            <h2 className="font-bold text-lg text-white">Revenue (Last 7 Days)</h2>
          </div>
          <div className="p-5">
            <RevenueChart data={financeData} />
          </div>
        </Card>

        <Card padding="none" className="flex flex-col">
          <div className="p-5 border-b border-muted bg-card-bg">
            <h2 className="font-bold text-lg text-white">System Activity</h2>
          </div>
          <div className="p-5 max-h-[385px] overflow-y-auto">
            <RecentActivityList activities={activityData} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users Table (Interactive Client Component) */}
        <Card padding="none" className="flex flex-col">
          <div className="p-5 border-b border-muted bg-card-bg">
            <h2 className="font-bold text-lg text-white">Recent Registrations</h2>
          </div>
          <AdminUsersTable users={stats.recentUsers} />
        </Card>

        {/* Recent Transactions Table */}
        <Card padding="none" className="flex flex-col">
          <div className="p-5 border-b border-muted bg-card-bg">
            <h2 className="font-bold text-lg text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-secondary uppercase bg-panel-bg">
                <tr>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted bg-card-bg">
                {stats.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4 truncate max-w-[150px] text-white">
                      {tx.user?.email || tx.userId}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${tx.type === 'purchase' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-4 font-mono font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-orange-400'}`}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount}
                    </td>
                    <td className="px-5 py-4 text-secondary">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  return (
    <Card className="relative overflow-hidden group p-6">
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-bl-[100px] -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-110`}
      ></div>
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h3 className="text-secondary font-medium mb-1.5">{title}</h3>
          <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
        <div className="text-3xl bg-panel-bg p-3 rounded-2xl shadow-inner border border-muted">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";

import { AdminService } from '@/src/lib/services/adminService';
import { Card } from '@/components/ui/Card';
import { CreditCard } from 'lucide-react';

export const metadata = {
  title: 'Finance & Ledger | Admin',
};

export default async function AdminFinancePage({ searchParams }) {
  const page = parseInt(searchParams.page) || 1;
  const { transactions, total, totalPages } = await AdminService.getAllTransactions({ page });

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          Global Ledger & Finance
        </h2>
        <p className="text-neutral-secondary mt-1">
          Track all platform transactions, purchases, and API credit usage.
        </p>
      </div>

      <Card className="p-0 border-neutral-border-glass bg-neutral-card-bg/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-border-glass bg-white/5 text-sm font-medium text-neutral-400">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border-glass">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-neutral-500">
                    {tx.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{tx.user.name}</div>
                    <div className="text-sm text-neutral-500">{tx.user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        tx.type === 'purchase'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 font-mono ${tx.amount > 0 ? 'text-green-400' : 'text-neutral-300'}`}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount}
                  </td>
                  <td className="px-6 py-4 text-neutral-400 text-sm">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              No transactions found on the ledger.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-full text-secondary">
        <Spinner size="lg" />
        <p>Loading Admin Data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 font-medium">Error: {error}</div>;
  }

  return (
    <div className="space-y-8 font-sans">
      <h1 className="text-3xl font-bold text-white">Platform Overview</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Users" value={data.metrics.totalUsers} icon="👥" color="from-blue-500 to-cyan-500" />
        <MetricCard title="Total Generations" value={data.metrics.totalGenerations} icon="⚡" color="from-purple-500 to-pink-500" />
        <MetricCard title="Credits Purchased" value={data.metrics.totalPurchasedCredits} icon="💎" color="from-green-500 to-emerald-500" />
        <MetricCard title="Credits Spent" value={data.metrics.totalSpentCredits} icon="🔥" color="from-orange-500 to-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users Table */}
        <Card padding="none" className="flex flex-col">
          <div className="p-5 border-b border-muted bg-card-bg">
            <h2 className="font-bold text-lg text-white">Recent Registrations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-secondary uppercase bg-panel-bg">
                <tr>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Credits</th>
                  <th className="px-5 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted bg-card-bg">
                {data.recentUsers.map(user => (
                  <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{user.name || 'Anonymous'}</div>
                      <div className="text-xs text-secondary mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-purple-400 font-mono font-medium">{user.credits}</td>
                    <td className="px-5 py-4 text-secondary">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                {data.recentTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4 truncate max-w-[150px] text-white">
                      {tx.user?.email || tx.userId}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${tx.type === 'purchase' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-5 py-4 font-mono font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
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
    <Card className="relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-bl-[100px] -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-110`}></div>
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h3 className="text-secondary font-medium mb-1.5">{title}</h3>
          <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
        <div className="text-3xl bg-panel-bg p-3 rounded-2xl shadow-inner border border-muted">{icon}</div>
      </div>
    </Card>
  );
}

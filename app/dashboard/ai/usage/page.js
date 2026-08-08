'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Loader2, Activity, Zap, Server } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function TokenUsageDashboard() {
  const [data, setData] = useState({ summary: [], logs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/ai/usage?days=30');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  const totalTokens = data.summary.reduce((acc, curr) => acc + curr._sum.totalTokens, 0);
  const totalCost = data.summary.reduce((acc, curr) => acc + curr._sum.costInCents, 0) / 100;

  // Format data for chart
  const chartData = data.summary.map((item) => ({
    name: item.model,
    tokens: item._sum.totalTokens,
    cost: item._sum.costInCents / 100,
  }));

  const colors = ['#22d3ee', '#818cf8', '#a78bfa', '#e879f9', '#f472b6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Token Usage & Cost</h1>
        <p className="text-zinc-400 mt-1">
          Monitor your AI model consumption over the last 30 days.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Tokens</CardTitle>
            <Activity className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalTokens.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Estimated Cost
            </CardTitle>
            <Zap className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalCost.toFixed(4)}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Models Used</CardTitle>
            <Server className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.summary.length}</div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle>Usage by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    stroke="#52525b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#52525b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: '#27272a' }}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900/30 border-zinc-800 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-48 text-zinc-500">
            <Activity className="h-8 w-8 mb-4 opacity-50" />
            <p>No usage data recorded in the last 30 days.</p>
          </CardContent>
        </Card>
      )}

      {data.logs.length > 0 && (
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader>
            <CardTitle>Recent Invocations</CardTitle>
            <CardDescription>The last 100 model requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Model</th>
                    <th className="px-4 py-3">Prompt</th>
                    <th className="px-4 py-3">Completion</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3 rounded-tr-lg">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((log, i) => (
                    <tr
                      key={log.id}
                      className={`border-b border-zinc-800/50 ${i % 2 === 0 ? 'bg-zinc-900/20' : 'bg-transparent'}`}
                    >
                      <td className="px-4 py-3 font-medium text-white">{log.model}</td>
                      <td className="px-4 py-3 text-zinc-400">{log.promptTokens}</td>
                      <td className="px-4 py-3 text-zinc-400">{log.completionTokens}</td>
                      <td className="px-4 py-3 text-cyan-400">{log.totalTokens}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

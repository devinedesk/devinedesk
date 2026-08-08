'use client';

import { Card } from '@/components/ui/Card';
import {
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  Loader2,
  DollarSign,
  CreditCard,
  Receipt,
  Users,
  UserCheck,
  ShieldAlert,
  Activity,
  Key,
  Globe,
  CheckCircle,
  Database,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?days=${days}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

  const statCards = [
    { title: 'Avg. Generation Time', value: data?.stats?.avgGenerationTime || '0s', icon: Clock },
    { title: 'Success Rate', value: data?.stats?.successRate || '0%', icon: TrendingUp },
    { title: 'Total Requests', value: data?.stats?.totalRequests || 0, icon: BarChart3 },
    { title: 'API Cost', value: data?.stats?.apiCost || '0 credits', icon: FileText },
  ];
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-neutral-secondary mt-2">
            Deep dive into your API usage and generation metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-black/40 border border-neutral-border-glass rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-neutral-secondary">{stat.title}</p>
            </div>
            {loading ? (
              <div className="h-8 w-24 bg-white/5 rounded animate-pulse mt-4"></div>
            ) : (
              <h2 className="text-2xl font-semibold text-white mt-4">{stat.value}</h2>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="p-6 min-h-[400px] border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md">
          <h3 className="text-lg font-semibold mb-4 text-white">Requests Over Time</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 text-neutral-secondary animate-spin" />
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.charts?.timeline || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#888"
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#111',
                      borderColor: '#333',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="image"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="video"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-6 min-h-[400px] border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md">
          <h3 className="text-lg font-semibold mb-4 text-white">Usage by Model</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 text-neutral-secondary animate-spin" />
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.charts?.models || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {(data?.charts?.models || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#111',
                      borderColor: '#333',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

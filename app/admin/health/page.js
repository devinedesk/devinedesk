'use client';

import { Card } from '@/components/ui/Card';
import { Activity, Server, Database, AlertCircle, CheckCircle2, Zap, Globe } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const cpuData = [
  { time: '10:00', value: 45 },
  { time: '10:05', value: 52 },
  { time: '10:10', value: 48 },
  { time: '10:15', value: 71 }, // Spike
  { time: '10:20', value: 65 },
  { time: '10:25', value: 42 },
  { time: '10:30', value: 45 },
];

export default function SystemHealthDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          System Health & Metrics
        </h2>
        <p className="text-neutral-secondary mt-1">
          Deep-dive telemetry and performance monitoring.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="text-cyan-500" size={20} />
              <h3 className="text-lg font-medium text-white">CPU & Memory Utilization</h3>
            </div>
            <select className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
              <option>Last 1 Hour</option>
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
            </select>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpuData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#ffffff40"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#ffffff40"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000000',
                    borderColor: '#ffffff20',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Node Status */}
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
          <h3 className="text-lg font-medium text-white mb-6">Service Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <Globe size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Edge CDN</div>
                  <div className="text-xs text-neutral-500">Vercel Edge Network</div>
                </div>
              </div>
              <span className="flex items-center text-xs font-medium text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" /> Operational
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <Database size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Primary DB</div>
                  <div className="text-xs text-neutral-500">PostgreSQL (us-east)</div>
                </div>
              </div>
              <span className="flex items-center text-xs font-medium text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" /> Operational
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <Server size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">AI Workers</div>
                  <div className="text-xs text-neutral-500">GPU Cluster A</div>
                </div>
              </div>
              <span className="flex items-center text-xs font-medium text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" /> Operational
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">WebSocket Relay</div>
                  <div className="text-xs text-yellow-500/80">High Latency</div>
                </div>
              </div>
              <span className="flex items-center text-xs font-medium text-yellow-500">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-1.5" /> Degraded
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  Globe,
} from 'lucide-react';

export default function StatusPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setHealth({
        status: 'major_outage',
        services: {
          database: { status: 'down', latency: 0 },
          api: { status: 'down', latency: 0 },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'operational':
        return {
          color: 'text-emerald-400',
          bg: 'bg-emerald-400/10',
          border: 'border-emerald-400/20',
          text: 'All Systems Operational',
          icon: ShieldCheck,
        };
      case 'degraded':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-400/10',
          border: 'border-yellow-400/20',
          text: 'Degraded Performance',
          icon: AlertTriangle,
        };
      case 'major_outage':
        return {
          color: 'text-red-400',
          bg: 'bg-red-400/10',
          border: 'border-red-400/20',
          text: 'Major Outage',
          icon: XCircle,
        };
      default:
        return {
          color: 'text-neutral-400',
          bg: 'bg-neutral-800',
          border: 'border-neutral-700',
          text: 'Checking Status...',
          icon: Activity,
        };
    }
  };

  const config = getStatusConfig(health?.status);
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">devinedesk status</span>
          </Link>
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/" className="text-neutral-400 hover:text-white transition-colors">
              Main Site
            </Link>
            <Link
              href="/dashboard/support"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Aggregate Status Banner */}
        <div
          className={`p-6 rounded-2xl border ${config.border} ${config.bg} flex items-center justify-between transition-all duration-500`}
        >
          <div className="flex items-center gap-4">
            <Icon className={`h-8 w-8 ${config.color}`} />
            <div>
              <h1 className={`text-2xl font-bold ${config.color}`}>{config.text}</h1>
              <p className="text-sm text-neutral-400 mt-1">
                Refreshed every 30 seconds. Last checked:{' '}
                {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '...'}
              </p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API Routing */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-neutral-400" />
                <h2 className="text-lg font-semibold">API Routing</h2>
              </div>
              <span
                className={`text-sm font-bold ${health?.services?.api?.status === 'up' ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {health?.services?.api?.status === 'up' ? 'Operational' : 'Down'}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-mono tracking-tighter">
                {loading ? '--' : health?.services?.api?.latency}
              </span>
              <span className="text-neutral-500 mb-1 font-medium">ms latency</span>
            </div>
          </div>

          {/* Database */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-neutral-400" />
                <h2 className="text-lg font-semibold">PostgreSQL Database</h2>
              </div>
              <span
                className={`text-sm font-bold ${health?.services?.database?.status === 'up' ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {health?.services?.database?.status === 'up' ? 'Operational' : 'Down'}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-mono tracking-tighter">
                {loading ? '--' : health?.services?.database?.latency}
              </span>
              <span className="text-neutral-500 mb-1 font-medium">ms latency</span>
            </div>
          </div>
        </div>

        {/* Uptime Visualization */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">90-Day Uptime History</h2>
            <span className="text-emerald-400 font-bold">
              {loading ? '--.--%' : `${health?.uptimePercentage || 99.99}%`}
            </span>
          </div>
          <div className="flex gap-1 h-12 items-end group">
            {loading
              ? Array.from({ length: 90 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-neutral-800 rounded-sm"
                    style={{ height: '100%' }}
                  ></div>
                ))
              : health?.uptimeHistory?.map((day, i) => {
                  let colorClass = 'bg-emerald-500/80 hover:bg-emerald-400';
                  let height = '100%';

                  if (day.status === 'degraded') {
                    colorClass = 'bg-yellow-500/80 hover:bg-yellow-400';
                    height = '80%';
                  } else if (day.status === 'major_outage') {
                    colorClass = 'bg-red-500/80 hover:bg-red-400';
                    height = '50%';
                  }

                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm cursor-pointer transition-colors ${colorClass}`}
                      style={{ height }}
                      title={`${day.date}: ${day.uptime}% uptime. ${day.status.replace('_', ' ')}`}
                    ></div>
                  );
                })}
          </div>
          <div className="flex justify-between mt-4 text-xs text-neutral-500 font-medium uppercase tracking-wider">
            <span>90 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </main>
    </div>
  );
}

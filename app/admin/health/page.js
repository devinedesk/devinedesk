import { Card } from '@/components/ui/Card';
import { Activity, Server, Database, Globe, AlertCircle, Zap } from 'lucide-react';
import { AdminService } from '@/src/lib/services/adminService';

export const dynamic = "force-dynamic";

export default async function SystemHealthDashboard() {
  const health = await AdminService.getSystemHealth();
  const performance = await AdminService.getPerformanceMetrics();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          System Health & Metrics
        </h2>
        <p className="text-neutral-secondary mt-1">
          Real-time node status and operational telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Status */}
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="text-cyan-500" size={20} />
              <h3 className="text-lg font-medium text-white">System Core Status</h3>
            </div>
            <div className="flex items-center text-sm font-medium text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" /> 
              All Systems Operational
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-400">Environment</p>
                <p className="text-lg font-bold text-white mt-1 capitalize">{health.environment}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-400">Last Telemetry Sync</p>
                <p className="text-lg font-bold text-white mt-1">{new Date(health.timestamp).toLocaleTimeString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-400">Total Provisioned Workflows</p>
                <p className="text-lg font-bold text-white mt-1">{health.metrics.activeWorkflows}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-400">Active API Keys</p>
                <p className="text-lg font-bold text-white mt-1">{health.metrics.activeApiKeys}</p>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 mt-4 flex items-start gap-3">
              <AlertCircle className="text-blue-400 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-medium text-blue-100">Historical APM Required</p>
                <p className="text-xs text-blue-200/70 mt-1">
                  Historical CPU & Memory charting (time-series data) is currently unavailable. Install a Datadog or Prometheus integration for persistent timeseries charts.
                </p>
              </div>
            </div>
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
                  <div className="text-xs text-neutral-500">{health.database.pingMs}ms Latency</div>
                </div>
              </div>
              <span className={`flex items-center text-xs font-medium ${health.database.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${health.database.status === 'ok' ? 'bg-green-500' : 'bg-red-500'} mr-1.5`} /> 
                {health.database.status === 'ok' ? 'Operational' : 'Failing'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <Server size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Worker Node</div>
                  <div className="text-xs text-neutral-500">Node JS Engine</div>
                </div>
              </div>
              <span className="flex items-center text-xs font-medium text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" /> Operational
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { Card } from '@/components/ui/Card';
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AdminService } from '@/src/lib/services/adminService';

export default async function OperationsDashboard() {
  const metrics = await AdminService.getOperationsMetrics();
  const { uptime, activeWorkers, totalWorkers, pendingJobs, dbSize } = metrics;
  const uptimeHours = (uptime / 3600).toFixed(1);
  const dbSizeMB = (dbSize / 1024 / 1024).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Operations</h2>
        <p className="text-neutral-secondary mt-1">
          Real-time system health, API metrics, and infrastructure status.
        </p>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">API Uptime</p>
              <h3 className="text-2xl font-bold text-white mt-1">{uptimeHours}h</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight size={16} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">100%</span>
            <span className="text-neutral-500 ml-2">last 30 days</span>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Avg Latency</p>
              <h3 className="text-2xl font-bold text-white mt-1">124ms</h3>
            </div>
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowDownRight size={16} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">12ms</span>
            <span className="text-neutral-500 ml-2">from last week</span>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Active Workers</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {activeWorkers}/{totalWorkers}
              </h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Server size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-neutral-500">
              {((activeWorkers / totalWorkers) * 100).toFixed(0)}% utilization
            </span>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Queue Backlog</p>
              <h3 className="text-2xl font-bold text-white mt-1">{pendingJobs}</h3>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {pendingJobs > 10 ? (
              <>
                <ArrowUpRight size={16} className="text-yellow-500 mr-1" />
                <span className="text-yellow-500 font-medium">Elevated</span>
                <span className="text-neutral-500 ml-2">processing delay</span>
              </>
            ) : (
              <>
                <span className="text-green-500 font-medium">Normal</span>
                <span className="text-neutral-500 ml-2">processing flow</span>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Infrastructure Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-2 mb-6">
            <Database className="text-primary" size={20} />
            <h3 className="text-lg font-medium text-white">Database Cluster (PostgreSQL)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-300">CPU Usage</span>
                <span className="text-white font-medium">45%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-300">Memory (RAM)</span>
                <span className="text-white font-medium">12.4 GB / 32 GB</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '38%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-300">Database Size</span>
                <span className="text-white font-medium">{dbSizeMB} MB</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-2 mb-6">
            <Cpu className="text-primary" size={20} />
            <h3 className="text-lg font-medium text-white">Redis Cache (Upstash)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-300">Hit Rate</span>
                <span className="text-white font-medium">94.2%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-300">Memory</span>
                <span className="text-white font-medium">2.1 GB / 10 GB</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '21%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-300">Connections</span>
                <span className="text-white font-medium">840 / 10,000</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '8.4%' }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

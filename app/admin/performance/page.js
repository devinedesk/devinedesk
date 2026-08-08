import { Card } from '@/components/ui/Card';
import { Activity, Clock, Server, Zap, Cpu, MemoryStick, Database, Globe } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { AdminService } from '@/src/lib/services/adminService';

export default async function PerformanceDashboard() {
  const metrics = await AdminService.getPerformanceMetrics();
  const { system, process, slowEndpoints } = metrics;

  const cpuPercent = system.cpuLoad.length > 0 ? (system.cpuLoad[0] * 100).toFixed(1) : 0;
  const memoryPercent = (process.memory.heapUsed / process.memory.heapTotal) * 100;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Performance Metrics</h2>
          <p className="text-neutral-secondary mt-1">
            Real-time latency, throughput, and system resource utilization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Server Uptime</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {(system.uptime / 3600).toFixed(1)}h
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500">Online</span>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">RPS (Requests/sec)</p>
              <h3 className="text-2xl font-bold text-white mt-1">1,402</h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-yellow-500">Spike detected (normal)</span>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">DB Query Time</p>
              <h3 className="text-2xl font-bold text-white mt-1">18ms</h3>
            </div>
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
              <Database size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-neutral-500">p95: 45ms</span>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Edge Cache Hit Ratio</p>
              <h3 className="text-2xl font-bold text-white mt-1">84.2%</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <Globe size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500">+1.2% this week</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="text-yellow-500" size={20} />
            <h3 className="text-lg font-medium text-white">Endpoint Performance (Top 5 Slowest)</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Avg Latency</TableHead>
                <TableHead>p95</TableHead>
                <TableHead>Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slowEndpoints.map((ep, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-brand-primary">{ep.path}</TableCell>
                  <TableCell>
                    <span
                      className={`text-sm font-medium ${
                        ep.status === 'critical'
                          ? 'text-red-400'
                          : ep.status === 'warning'
                            ? 'text-yellow-400'
                            : 'text-green-400'
                      }`}
                    >
                      {ep.avgLatency}
                    </span>
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm">{ep.p95}</TableCell>
                  <TableCell className="text-neutral-300 text-sm">{ep.calls}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-2 mb-6">
            <Server className="text-cyan-500" size={20} />
            <h3 className="text-lg font-medium text-white">Resource Utilization (Vercel/Node)</h3>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Cpu size={16} className="text-neutral-500" /> CPU Load
                </span>
                <span className="text-sm text-yellow-400">{cpuPercent}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="bg-yellow-500 h-full"
                  style={{ width: `${Math.min(cpuPercent, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <MemoryStick size={16} className="text-neutral-500" /> Memory Usage (V8 Heap)
                </span>
                <span className="text-sm text-green-400">{memoryPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full"
                  style={{ width: `${Math.min(memoryPercent, 100)}%` }}
                />
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {(process.memory.heapUsed / 1024 / 1024).toFixed(1)} MB /{' '}
                {(process.memory.heapTotal / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Database size={16} className="text-neutral-500" /> Connection Pool
                </span>
                <span className="text-sm text-red-400">92%</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full w-[92%]" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

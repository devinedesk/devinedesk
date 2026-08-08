export const dynamic = "force-dynamic";

import { Card } from '@/components/ui/Card';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Activity, Clock, Server, Play, Pause, RefreshCw, AlertCircle, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AdminService } from '@/src/lib/services/adminService';
import { EmptyState } from '@/components/states/EmptyState';
import { ListFilter } from 'lucide-react';

const getStatusColor = (status) => {
  switch (status) {
    case 'RUNNING':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'PENDING':
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    case 'COMPLETED':
      return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'FAILED':
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    default:
      return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'text-red-400';
    case 'normal':
      return 'text-blue-400';
    case 'low':
      return 'text-neutral-400';
    default:
      return 'text-neutral-400';
  }
};

export default async function QueueDashboard() {
  const { runs, total } = await AdminService.getQueueJobs({ page: 1, limit: 50 });

  const processingCount = runs.filter((r) => r.status === 'RUNNING').length;
  const queuedCount = runs.filter((r) => r.status === 'PENDING').length;
  const failedCount = runs.filter((r) => r.status === 'FAILED').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Job Queues (BullMQ)</h2>
          <p className="text-neutral-secondary mt-1">
            Manage background workers, generation tasks, and async processes.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-700">
            <Pause size={16} /> Pause All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Processing</p>
              <h3 className="text-2xl font-bold text-white mt-1">{processingCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Queued (Waiting)</p>
              <h3 className="text-2xl font-bold text-white mt-1">{queuedCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Failed (Retrying)</p>
              <h3 className="text-2xl font-bold text-white mt-1">{failedCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <Server size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Active Workers</p>
              <h3 className="text-2xl font-bold text-white mt-1">24</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="text-brand-primary" size={20} />
              <h3 className="text-lg font-medium text-white">Live Job Feed</h3>
            </div>
            <div className="flex gap-2">
              <select className="bg-neutral-900 border border-neutral-border-glass rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors">
                <option>All Queues</option>
                <option>workflows</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0 hover:bg-transparent">
                      <EmptyState
                        icon={ListFilter}
                        title="Queue is empty"
                        description="Background jobs and workflows will appear here."
                      />
                    </TableCell>
                  </TableRow>
                )}
                {runs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs text-neutral-400 truncate max-w-[80px] inline-block">
                      {job.id}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-white text-sm truncate max-w-[150px] inline-block">
                        {job.workflow?.name || 'Workflow Run'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-semibold ${getPriorityColor('normal')} uppercase tracking-wider`}
                      >
                        normal
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusColor(job.status)}`}
                        >
                          {job.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-neutral-400 text-xs font-mono">
                      worker-node-unknown
                    </TableCell>
                    <TableCell className="text-right">
                      {job.status === 'FAILED' && (
                        <button
                          className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                          title="Retry"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 lg:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <Server className="text-cyan-500" size={20} />
            <h3 className="text-lg font-medium text-white">Worker Fleet</h3>
          </div>

          <div className="space-y-4">
            <div className="p-3 border border-neutral-border-glass rounded-lg bg-black/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white">worker-group-gpu</span>
                <Badge
                  variant="outline"
                  className="text-green-400 border-green-500/20 bg-green-500/10"
                >
                  16/16 Online
                </Badge>
              </div>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Load: 85%</span>
                <span>Queues: image_gen, video</span>
              </div>
            </div>

            <div className="p-3 border border-neutral-border-glass rounded-lg bg-black/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white">worker-group-cpu</span>
                <Badge
                  variant="outline"
                  className="text-green-400 border-green-500/20 bg-green-500/10"
                >
                  8/8 Online
                </Badge>
              </div>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Load: 24%</span>
                <span>Queues: webhooks, billing</span>
              </div>
            </div>

            <button className="w-full py-2 mt-4 text-sm text-white font-medium bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors">
              Scale Fleet Settings
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { Card } from '@/components/ui/Card';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import {
  Activity,
  Search,
  Filter,
  ShieldAlert,
  Download,
  Database,
  Server,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import prisma from '@/src/lib/prisma';
import { formatDistanceToNow } from 'date-fns';
import { EmptyState } from '@/components/states/EmptyState';

export default async function AuditDashboard() {
  const auditLogs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });

  const totalEvents = await prisma.auditLog.count();

  // Mapping DB logs to UI state
  const logs = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    resource: log.resource,
    user: log.user?.email || log.userId || 'system',
    ip: log.metadata?.ip || 'internal',
    time: formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }),
    status: log.metadata?.status || 'success',
  }));

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'error':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Audit & Compliance</h2>
          <p className="text-neutral-secondary mt-1">
            Immutable ledger of all platform activities and system events.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-700">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Total Events</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalEvents.toLocaleString()}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Security Events</p>
              <h3 className="text-2xl font-bold text-white mt-1">--</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">User Actions</p>
              <h3 className="text-2xl font-bold text-white mt-1">--</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
              <Server size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">System Events</p>
              <h3 className="text-2xl font-bold text-white mt-1">--</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-neutral-border-glass bg-neutral-card-bg/50 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-neutral-border-glass flex flex-wrap justify-between items-center bg-black/20 gap-4">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by action, user, or IP..."
              className="w-full bg-neutral-900 border border-neutral-border-glass rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-neutral-900 border border-neutral-border-glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors">
              <option>Resource: All</option>
              <option>Resource: Auth</option>
              <option>Resource: Billing</option>
              <option>Resource: API Keys</option>
            </select>
            <button className="flex items-center justify-center p-2 bg-neutral-900 border border-neutral-border-glass rounded-lg text-neutral-400 hover:text-white transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0 hover:bg-transparent">
                    <EmptyState
                      icon={Activity}
                      title="No audit logs"
                      description="System events and activities will appear here."
                    />
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-neutral-400 text-sm">{log.time}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-medium text-white">{log.action}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-neutral-400 border-neutral-700 bg-neutral-800/50 uppercase tracking-wider text-[10px]"
                    >
                      {log.resource}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-300 text-sm">{log.user}</TableCell>
                  <TableCell className="text-neutral-400 text-sm font-mono">{log.ip}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border capitalize ${getStatusColor(log.status)}`}
                    >
                      {log.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-neutral-border-glass bg-black/20 flex justify-between items-center text-sm text-neutral-400">
          <span>
            Showing {logs.length} of {totalEvents.toLocaleString()} events
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 transition-colors disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

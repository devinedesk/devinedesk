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
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  Users,
  AlertTriangle,
  Activity,
  Lock,
  Globe,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AdminService } from '@/src/lib/services/adminService';

export default async function SecurityAdminDashboard() {
  const securityData = await AdminService.getSecurityMetrics();
  const { auditLogs, activeThreats, failedLogins, mfaAdoption, apiKeysIssued } = securityData;

  const getEventColor = (event) => {
    if (event.includes('FAILED') || event.includes('ERROR')) return 'text-red-400';
    if (event.includes('CREATED') || event.includes('SUCCESS')) return 'text-green-400';
    if (event.includes('UPDATED') || event.includes('MODIFIED')) return 'text-yellow-400';
    return 'text-cyan-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Security Command Center
          </h2>
          <p className="text-neutral-secondary mt-1">
            Platform-wide security posture, active threats, and audit trails.
          </p>
        </div>
      </div>

      {/* Security Posture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-red-500/20 bg-red-500/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-red-400">Active Threats</p>
              <h3 className="text-2xl font-bold text-white mt-1">{activeThreats}</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {activeThreats > 0 ? (
              <span className="text-red-400 font-medium">Action Required</span>
            ) : (
              <span className="text-green-400 font-medium">All Clear</span>
            )}
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Failed Logins</p>
              <h3 className="text-2xl font-bold text-white mt-1">{failedLogins}</h3>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <Lock size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-neutral-500">Last 24 hours</span>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">2FA Adoption</p>
              <h3 className="text-2xl font-bold text-white mt-1">{mfaAdoption}%</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500">Current</span>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">API Keys Issued</p>
              <h3 className="text-2xl font-bold text-white mt-1">{apiKeysIssued}</h3>
            </div>
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
              <Key size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-neutral-500">Total Active</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Threats Panel */}
        <Card className="p-6 border-red-500/20 bg-neutral-card-bg/50 lg:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert className="text-red-500" size={20} />
            <h3 className="text-lg font-medium text-white">Active Alerts</h3>
          </div>
          <div className="space-y-4">
            {activeThreats === 0 ? (
              <p className="text-sm text-neutral-400">No active threats detected.</p>
            ) : (
              <>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                      High Traffic Anomaly
                    </span>
                    <span className="text-xs text-neutral-500">Recent</span>
                  </div>
                  <p className="text-sm text-neutral-300">
                    Unusual spike in requests detected. Rate limiting is active.
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Global Audit Log */}
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-cyan-500" size={20} />
            <h3 className="text-lg font-medium text-white">Global Audit Log (Real-time)</h3>
          </div>

          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>User / IP</TableHead>
                  <TableHead>Resource</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-neutral-500 py-4">
                      No recent audit logs.
                    </TableCell>
                  </TableRow>
                )}
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-neutral-400 text-xs">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <span className={`${getEventColor(log.action)} text-sm font-medium`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-neutral-300 text-sm">
                      {log.user?.email || log.userId} ({log.ipAddress || 'Unknown IP'})
                    </TableCell>
                    <TableCell className="text-neutral-400 text-xs font-mono truncate max-w-[150px] inline-block">
                      {log.resource}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}

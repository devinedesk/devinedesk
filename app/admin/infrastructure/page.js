import { AdminService } from '@/src/lib/services/adminService';
import { Card } from '@/components/ui/Card';
import { Server, Database, Activity, Key } from 'lucide-react';

export const metadata = {
  title: 'Infrastructure | Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminInfrastructurePage() {
  const health = await AdminService.getSystemHealth();

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Server className="h-6 w-6 text-primary" />
          System Infrastructure
        </h2>
        <p className="text-neutral-secondary mt-1">Real-time health of the platform services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Database size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Database Status</p>
              <h3 className="text-2xl font-bold text-white mt-1 capitalize">
                {health.database.status}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">Ping: {health.database.pingMs}ms</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Key size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Active API Keys</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {health.metrics.activeApiKeys.toLocaleString()}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">Secure tokens distributed</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Active Workflows</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {health.metrics.activeWorkflows.toLocaleString()}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">Running distributed sequences</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/10 text-green-400 rounded-xl">
              <Server size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Environment</p>
              <h3 className="text-2xl font-bold text-white mt-1 capitalize">
                {health.environment}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Last checked: {new Date(health.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

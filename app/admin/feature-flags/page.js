import { Card } from '@/components/ui/Card';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Flag, Activity, Zap, Shield, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AdminService } from '@/src/lib/services/adminService';
import { revalidatePath } from 'next/cache';
import { EmptyState } from '@/components/states/EmptyState';

export default async function FeatureFlagsDashboard() {
  const flags = await AdminService.getFeatureFlags();

  const totalFlags = flags.length;
  const activeFlags = flags.filter((f) => f.enabled).length;

  async function toggleFlagAction(formData) {
    'use server';
    const id = formData.get('id');
    await AdminService.toggleFeatureFlag(id);
    revalidatePath('/admin/feature-flags');
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Feature Flags</h2>
          <p className="text-neutral-secondary mt-1">
            Manage rollouts, kill switches, and experimental features globally.
          </p>
        </div>
        <button className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-secondary transition-colors">
          Create Flag
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Total Flags</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalFlags}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Flag size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-green-500/20 bg-green-500/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-green-400">Active (Production)</p>
              <h3 className="text-2xl font-bold text-white mt-1">{activeFlags}</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <Activity size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Kill Switches Engaged</p>
              <h3 className="text-2xl font-bold text-white mt-1">0</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <Shield size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Pending Rollouts</p>
              <h3 className="text-2xl font-bold text-white mt-1">0</h3>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <Zap size={20} />
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-neutral-border-glass bg-neutral-card-bg/50 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-border-glass flex justify-between items-center bg-black/20">
          <div className="relative w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search flags..."
              className="w-full bg-neutral-900 border border-neutral-border-glass rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-neutral-900 border border-neutral-border-glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors">
              <option>Environment: Production</option>
              <option>Environment: Staging</option>
              <option>Environment: Development</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flag Key</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Rollout %</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0 hover:bg-transparent">
                    <EmptyState
                      icon={Flag}
                      title="No feature flags"
                      description="Create a flag to manage rollouts and features."
                    />
                  </TableCell>
                </TableRow>
              )}
              {flags.map((flag) => (
                <TableRow key={flag.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-brand-primary px-2 py-1 bg-brand-primary/10 rounded-md border border-brand-primary/20">
                      {flag.key}
                    </span>
                  </TableCell>
                  <TableCell className="text-neutral-300 text-sm font-medium">
                    {flag.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-neutral-400 border-neutral-700 bg-neutral-800/50"
                    >
                      {flag.env}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${flag.enabled ? 'bg-green-500' : 'bg-neutral-600'}`}
                          style={{ width: flag.rollout }}
                        />
                      </div>
                      <span className="text-xs text-neutral-400">{flag.rollout}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-400 text-xs">
                    {new Date(flag.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={toggleFlagAction}>
                      <input type="hidden" name="id" value={flag.id} />
                      <button
                        type="submit"
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          flag.enabled
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700'
                        }`}
                      >
                        {flag.enabled ? (
                          <>
                            <ToggleRight size={16} />
                            Enabled
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={16} />
                            Disabled
                          </>
                        )}
                      </button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

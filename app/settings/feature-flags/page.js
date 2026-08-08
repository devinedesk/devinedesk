export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth/next';
import prisma from '@/src/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Save, Flag } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function FeatureFlagsSettings() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/auth/signin');

  // Only Admins can manage feature flags
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center text-neutral-400">
        You do not have permission to manage feature flags.
      </div>
    );
  }

  const featureFlags = await prisma.featureFlag.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white capitalize flex items-center gap-2">
          <Flag /> Feature Flags
        </h2>
        <p className="text-neutral-secondary mt-1">Manage experimental features and platform rollouts.</p>
      </div>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
        <form
          action={async (formData) => {
            'use server';
            const s = await getServerSession();
            if (!s || (s.user.role !== 'ADMIN' && s.user.role !== 'SUPER_ADMIN')) return;
            
            // Re-fetch flags to know all keys
            const flags = await prisma.featureFlag.findMany();
            
            for (const flag of flags) {
              const isEnabled = formData.get(`flag_${flag.id}`) === 'on';
              if (flag.enabled !== isEnabled) {
                await prisma.featureFlag.update({
                  where: { id: flag.id },
                  data: { enabled: isEnabled }
                });
              }
            }
          }}
        >
          <div className="space-y-6">
            {featureFlags.length === 0 ? (
              <p className="text-sm text-neutral-400">No feature flags found in the database.</p>
            ) : (
              featureFlags.map(flag => (
                <div key={flag.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <h3 className="font-medium text-white">{flag.name}</h3>
                    <p className="text-xs text-neutral-500 mt-1 font-mono">{flag.key} • {flag.env} • {flag.rollout}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name={`flag_${flag.id}`}
                      defaultChecked={flag.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-neutral-border-glass flex justify-end">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-hover text-black px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

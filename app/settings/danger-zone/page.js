export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth/next';
import prisma from '@/src/lib/prisma';
import { Card } from '@/components/ui/Card';
import { AlertTriangle, Trash2, LogOut } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function DangerZoneSettings() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/auth/signin');

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-red-500 capitalize flex items-center gap-2">
          <AlertTriangle /> Danger Zone
        </h2>
        <p className="text-neutral-secondary mt-1">Irreversible and destructive actions for your account.</p>
      </div>

      <div className="space-y-4">
        {/* Clear All History */}
        <Card className="p-6 border-red-900/50 bg-red-950/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-white">Clear Generation History</h3>
              <p className="text-sm text-neutral-400 mt-1">
                Permanently delete all your generated images, videos, and AI conversations. This cannot be undone.
              </p>
            </div>
            <form
              action={async () => {
                'use server';
                const s = await getServerSession();
                if (s?.user?.id) {
                  await prisma.generation.deleteMany({ where: { userId: s.user.id } });
                  await prisma.conversation.deleteMany({ where: { userId: s.user.id } });
                }
              }}
            >
              <button
                type="submit"
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Trash2 size={16} /> Clear History
              </button>
            </form>
          </div>
        </Card>

        {/* Delete Account */}
        <Card className="p-6 border-red-900/50 bg-red-950/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-white">Delete Account</h3>
              <p className="text-sm text-neutral-400 mt-1">
                Permanently delete your account and all associated data. Your active subscriptions will be canceled.
              </p>
            </div>
            <form
              action={async () => {
                'use server';
                const s = await getServerSession();
                if (s?.user?.id) {
                  // Perform soft delete or hard delete based on policy
                  await prisma.user.update({
                    where: { id: s.user.id },
                    data: { deletedAt: new Date() }
                  });
                  redirect('/api/auth/signout');
                }
              }}
            >
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <LogOut size={16} /> Delete Account
              </button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}

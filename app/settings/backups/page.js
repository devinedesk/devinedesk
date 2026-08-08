export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth/next';
import prisma from '@/src/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Save, Download, Clock } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function BackupsSettings() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/auth/signin');

  // Fetch real setting from generic Setting table
  const setting = await prisma.setting.findUnique({
    where: { userId_key: { userId: session.user.id, key: 'backup_schedule' } },
  });

  const currentSchedule = setting?.value || 'disabled';

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white capitalize">Automated Backups</h2>
        <p className="text-neutral-secondary mt-1">
          Configure how frequently we automatically export your Workspace and Workflow data.
        </p>
      </div>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
        <form
          action={async (formData) => {
            'use server';
            const session = await getServerSession();
            if (!session) return;

            const val = formData.get('schedule');

            await prisma.setting.upsert({
              where: { userId_key: { userId: session.user.id, key: 'backup_schedule' } },
              update: { value: val },
              create: { userId: session.user.id, key: 'backup_schedule', value: val },
            });
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Backup Frequency
              </h3>
              <p className="text-sm text-neutral-400 mt-1">
                Backups are generated as standard JSON exports and saved to your exports directory.
              </p>
            </div>
            <select
              name="schedule"
              defaultValue={currentSchedule}
              className="bg-neutral-800 border border-neutral-border-glass text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="disabled">Disabled</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="mt-8 pt-4 border-t border-neutral-border-glass flex justify-end">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-hover text-black px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Save size={16} /> Save Schedule
            </button>
          </div>
        </form>
      </Card>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
        <form
          action={async () => {
            'use server';
            const session = await getServerSession();
            if (!session) return;

            // Trigger manual backup job immediately
            await prisma.job.create({
              data: {
                queueName: 'exports',
                jobName: 'user_data_export',
                data: { userId: session.user.id, source: 'manual_backup' }
              }
            });
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-neutral-400" />
                Manual Backup
              </h3>
              <p className="text-sm text-neutral-400 mt-1">
                Immediately enqueue a data export job to run in the background.
              </p>
            </div>
            <button
              type="submit"
              className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl border border-neutral-border-glass text-sm font-medium flex items-center gap-2 transition-colors"
            >
              Trigger Backup Now
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

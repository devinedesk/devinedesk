export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth/next';
import prisma from '@/src/lib/prisma';
import { Card } from '@/components/ui/Card';
import { DownloadCloud, Info } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function ExportSettings() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/auth/signin');

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white capitalize flex items-center gap-2">
          <DownloadCloud /> Export Data
        </h2>
        <p className="text-neutral-secondary mt-1">Download a copy of your data from DevineDesk.</p>
      </div>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg text-primary">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-white">Your Data Archive</h3>
              <p className="text-sm text-neutral-400 mt-1 max-w-xl">
                You can request an export of all your personal data, generated assets, workflows, and chat history. 
                The export will be provided in a standard JSON format along with zip archives of your generated media.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-border-glass">
            <form
              action={async () => {
                'use server';
                const s = await getServerSession();
                if (!s?.user?.id) return;
                
                // Add an export job to the new Job table
                await prisma.job.create({
                  data: {
                    queueName: 'exports',
                    jobName: 'user_data_export',
                    data: { userId: s.user.id }
                  }
                });
              }}
            >
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-black px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <DownloadCloud size={16} /> Request Data Export
              </button>
            </form>
            <p className="text-xs text-neutral-500 mt-3">
              Depending on the size of your account, this process may take up to a few hours. We will email you a secure download link when it is ready.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

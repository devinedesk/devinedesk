export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth/next';
import prisma from '@/src/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Save } from 'lucide-react';
import { FaSlack, FaGithub, FaFigma } from 'react-icons/fa';
import { redirect } from 'next/navigation';

export default async function IntegrationsSettings() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/auth/signin');

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white capitalize">Integrations</h2>
        <p className="text-neutral-secondary mt-1">Connect DevineDesk with your favorite tools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slack */}
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mb-4">
              <FaSlack className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-medium text-white text-lg">Slack</h3>
            <p className="text-sm text-neutral-400 mt-2">
              Get notified about workflow completions and team alerts directly in Slack.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Not Connected
            </span>
            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
              Connect
            </button>
          </div>
        </Card>

        {/* GitHub */}
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mb-4">
              <FaGithub className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-medium text-white text-lg">GitHub</h3>
            <p className="text-sm text-neutral-400 mt-2">
              Sync your AI agent prompts and workflow definitions to a GitHub repository.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Not Connected
            </span>
            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
              Connect
            </button>
          </div>
        </Card>

        {/* Figma */}
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mb-4">
              <FaFigma className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-medium text-white text-lg">Figma</h3>
            <p className="text-sm text-neutral-400 mt-2">
              Import designs and export generated images directly into your Figma canvas.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Not Connected
            </span>
            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
              Connect
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

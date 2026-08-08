export const dynamic = 'force-dynamic';
import { Card } from '@/components/ui/Card';
import prisma from '@/src/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  BrainCircuit,
  Zap,
  BarChart,
  Cpu,
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  Users,
  UserCheck,
  ShieldAlert,
  Activity,
  Clock,
  Key,
  Globe,
  CheckCircle,
  Database,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function AIDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const [generations, workflowRuns] = await Promise.all([
    prisma.generation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.workflowRun.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        workflow: {
          select: { name: true },
        },
      },
    }),
  ]);

  const totalGenerationsCount = await prisma.generation.count({
    where: { userId: session.user.id },
  });

  const totalRunsCount = await prisma.workflowRun.count({
    where: { userId: session.user.id },
  });
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI & Workflows</h1>
        <p className="text-neutral-secondary mt-2">
          Monitor your generation history and automated workflow executions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-cyan-500/5 border-cyan-500/20 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-400/80 mb-1">Total Generations</p>
            <p className="text-3xl font-bold text-white tracking-tight">{totalGenerationsCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Zap className="h-6 w-6" />
          </div>
        </Card>
        <Card className="p-6 bg-purple-500/5 border-purple-500/20 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-400/80 mb-1">Workflow Executions</p>
            <p className="text-3xl font-bold text-white tracking-tight">{totalRunsCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/10 text-purple-400">
            <BrainCircuit className="h-6 w-6" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Generations */}
        <Card className="border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-border-glass flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" /> Recent Generations
            </h3>
          </div>

          <div className="flex-1 p-0">
            {generations.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Zap}
                  title="No Generations Yet"
                  description="Start using the AI studio or API to generate content."
                />
              </div>
            ) : (
              <div className="divide-y divide-neutral-border-glass">
                {generations.slice(0, 5).map((gen) => (
                  <div key={gen.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{gen.model || gen.type}</p>
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                          {gen.prompt || 'No prompt'}
                        </p>
                      </div>
                      <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                        {new Date(gen.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Workflows */}
        <Card className="border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-border-glass flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart className="h-5 w-5 text-purple-400" /> Recent Workflow Runs
            </h3>
          </div>

          <div className="flex-1 p-0">
            {workflowRuns.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={BrainCircuit}
                  title="No Workflows Executed"
                  description="Build and run a DAG in the Studio to see history here."
                />
              </div>
            ) : (
              <div className="divide-y divide-neutral-border-glass">
                {workflowRuns.map((run) => (
                  <div key={run.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {run.workflow?.name || 'Unknown Workflow'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium \${
                            run.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                            run.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                          >
                            {run.status}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                        {new Date(run.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

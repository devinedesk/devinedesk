export const dynamic = 'force-dynamic';
import { Card } from '@/components/ui/Card';
import prisma from '@/src/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { EmptyState } from '@/components/states/EmptyState';
import {
  History,
  Image as ImageIcon,
  Video,
  ExternalLink,
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
import Image from 'next/image';
import Link from 'next/link';

export default async function HistoryPage() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return null;
  }

  const generations = await prisma.generation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generation History</h1>
        <p className="text-neutral-secondary mt-2">
          View your recent AI generations and workflows.
        </p>
      </div>

      {generations.length === 0 ? (
        <EmptyState
          icon={History}
          title="No history found"
          description="You haven't generated any images or videos yet."
          action={
            <Link href="/studio">
              <button className="px-6 py-2 bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition-colors">
                Go to Studio
              </button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {generations.map((gen) => (
            <Card
              key={gen.id}
              className="overflow-hidden border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md flex flex-col group transition-all hover:border-white/20"
            >
              <div className="aspect-video relative bg-neutral-900 border-b border-neutral-border-glass">
                {gen.resultUrl ? (
                  gen.type.includes('video') ? (
                    <video
                      src={gen.resultUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={gen.resultUrl}
                      alt={gen.prompt || 'Generated image'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-secondary">
                    {gen.status === 'PROCESSING' ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-medium text-cyan-500 uppercase tracking-wider">
                          Processing
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-red-400">
                        <span className="text-xs font-medium uppercase tracking-wider">Failed</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 flex items-center gap-1.5">
                  {gen.type.includes('video') ? (
                    <Video size={12} className="text-purple-400" />
                  ) : (
                    <ImageIcon size={12} className="text-blue-400" />
                  )}
                  <span className="text-[10px] font-medium text-white uppercase tracking-wider">
                    {gen.type}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm text-neutral-secondary mb-4 line-clamp-2 flex-1">
                  {gen.prompt || 'No prompt provided.'}
                </p>

                <div className="flex items-center justify-between text-xs text-neutral-400 mt-auto pt-4 border-t border-neutral-border-glass">
                  <span>{new Date(gen.createdAt).toLocaleDateString()}</span>

                  {gen.resultUrl && (
                    <a
                      href={gen.resultUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      View Original <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import {
  Activity,
  CreditCard,
  Image as ImageIcon,
  Video,
  Users,
  Zap,
  ActivityIcon,
} from 'lucide-react';
import prisma from '@/src/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

async function DashboardContent() {
  const session = await getServerSession();

  let generationsCount = 0;
  let credits = 0;
  let imagesCount = 0;
  let videosCount = 0;
  let activityData = [];

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });
    credits = user?.credits || 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [total, images, videos, recentGenerations] = await Promise.all([
      prisma.generation.count({ where: { userId: session.user.id } }),
      prisma.generation.count({
        where: { userId: session.user.id, type: { in: ['workflow_image', 't2i'] } },
      }),
      prisma.generation.count({
        where: { userId: session.user.id, type: { in: ['workflow_video', 'video'] } },
      }),
      prisma.generation.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: sevenDaysAgo },
        },
        select: { createdAt: true },
      }),
    ]);

    generationsCount = total;
    imagesCount = images;
    videosCount = videos;

    // Process activity data for the last 7 days
    const daysMap = {};
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dayName = shortDays[d.getDay()];
      daysMap[dayName] = 0;
    }

    recentGenerations.forEach((gen) => {
      const dayName = shortDays[gen.createdAt.getDay()];
      if (daysMap[dayName] !== undefined) {
        daysMap[dayName]++;
      }
    });

    activityData = Object.keys(daysMap).map((key) => ({
      date: key,
      count: daysMap[key],
    }));
  }

  const stats = [
    {
      title: 'Total Generations',
      value: generationsCount.toLocaleString(),
      icon: Activity,
      change: '+0%',
    },
    { title: 'Credits Remaining', value: credits.toLocaleString(), icon: Zap, change: 'Active' },
    {
      title: 'Images Created',
      value: imagesCount.toLocaleString(),
      icon: ImageIcon,
      change: '+0%',
    },
    { title: 'Videos Created', value: videosCount.toLocaleString(), icon: Video, change: '+0%' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-neutral-secondary mt-2">
          Welcome back. Here&apos;s what&apos;s happening with your workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 tour-step-overview">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.change.startsWith('+') || stat.change === 'Active';
          return (
            <Card
              key={stat.title}
              className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-secondary">{stat.title}</p>
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-white/70" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <h2 className="text-3xl font-semibold text-white">{stat.value}</h2>
                <span
                  className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}
                >
                  {stat.change}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <Card className="col-span-2 p-6 min-h-[400px] border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md">
          <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
          {generationsCount === 0 ? (
            <div className="pt-8">
              <EmptyState
                icon={ActivityIcon}
                title="Welcome to Devinedesk"
                description="You haven't generated any assets yet. Use the Quick Actions panel to get started."
              />
            </div>
          ) : (
            <ActivityChart data={activityData} />
          )}
        </Card>

        <Card className={`col-span-1 p-6 border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md tour-step-actions ${generationsCount === 0 ? 'ring-2 ring-primary ring-offset-2 ring-offset-neutral-900 animate-pulse' : ''}`}>
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/studio"
              className="w-full bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-sm font-medium text-left flex items-center gap-3 transition-colors border border-transparent hover:border-white/10"
            >
              <ImageIcon className="h-4 w-4 text-primary" /> Create Image
            </Link>
            <Link
              href="/studio"
              className="w-full bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-sm font-medium text-left flex items-center gap-3 transition-colors border border-transparent hover:border-white/10"
            >
              <Video className="h-4 w-4 text-purple-400" /> Create Video
            </Link>
            <Link
              href="/settings/billing"
              className="w-full bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-sm font-medium text-left flex items-center gap-3 transition-colors border border-transparent hover:border-white/10"
            >
              <CreditCard className="h-4 w-4 text-emerald-400" /> Top Up Credits
            </Link>
            <Link
              href="/settings/organization"
              className="w-full bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-sm font-medium text-left flex items-center gap-3 transition-colors border border-transparent hover:border-white/10"
            >
              <Users className="h-4 w-4 text-blue-400" /> Invite Team Member
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

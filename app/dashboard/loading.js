import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex-1 w-full p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-white/5" />
          <Skeleton className="h-4 w-64 bg-white/5" />
        </div>
        <Skeleton className="h-10 w-32 bg-white/5 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 w-full rounded-2xl bg-white/5" />
        <Skeleton className="h-32 w-full rounded-2xl bg-white/5" />
        <Skeleton className="h-32 w-full rounded-2xl bg-white/5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Skeleton className="h-8 w-32 bg-white/5 mb-6" />
          <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
          <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
          <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
          <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 bg-white/5 mb-6" />
          <Skeleton className="h-64 w-full rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}

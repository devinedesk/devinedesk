import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500">
      <Skeleton className="h-9 w-64 mb-8" />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden p-6">
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-5 w-24 mb-3" />
                <Skeleton className="h-9 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-2xl" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card padding="none" className="flex flex-col">
          <div className="p-5 border-b border-muted">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="p-5">
            <Skeleton className="w-full h-[300px] rounded-lg" />
          </div>
        </Card>

        <Card padding="none" className="flex flex-col">
          <div className="p-5 border-b border-muted">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="p-5 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card padding="none" className="flex flex-col">
          <div className="p-5 border-b border-muted">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="p-5">
            <Skeleton className="w-full h-[250px] rounded-lg" />
          </div>
        </Card>

        <Card padding="none" className="flex flex-col">
          <div className="p-5 border-b border-muted">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="p-5">
            <Skeleton className="w-full h-[250px] rounded-lg" />
          </div>
        </Card>
      </div>
    </div>
  );
}

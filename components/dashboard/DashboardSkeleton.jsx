import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <Card className="col-span-2 p-6 min-h-[400px] border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md">
          <Skeleton className="h-7 w-40 mb-6" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </Card>

        <Card className="col-span-1 p-6 border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md">
          <Skeleton className="h-7 w-40 mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

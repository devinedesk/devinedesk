export function AdminSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-white/10 rounded w-1/4"></div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-64 bg-white/5 rounded-3xl w-full"></div>
        <div className="h-64 bg-white/5 rounded-3xl w-full"></div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <div className="text-white/60 text-sm font-medium tracking-wide">Loading DevineDesk...</div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center relative overflow-hidden">
      {/* Background Pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />

      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent border-l-transparent animate-spin"></div>
        </div>
        <div className="text-zinc-400 text-sm font-bold tracking-widest uppercase">
          Loading System...
        </div>
      </div>
    </div>
  );
}

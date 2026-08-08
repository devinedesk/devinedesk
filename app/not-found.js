import { ErrorState } from '@/components/ui/ErrorState';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        <ErrorState
          code="404"
          title="Lost in the void."
          message="The page you are looking for has either been moved, deleted, or never existed in this dimension."
          showHome={true}
        />
      </div>
    </div>
  );
}

import { Spinner } from '@/components/ui/Spinner';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center p-12 h-full min-h-[300px]">
      <Spinner size="lg" className="text-cyan-500" />
      <div className="text-zinc-400 text-sm font-medium tracking-wide mt-4">Loading data...</div>
    </div>
  );
}

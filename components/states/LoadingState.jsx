import { Loader2 } from 'lucide-react';

export function LoadingState({ text = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 h-full min-h-[300px]">
      <div className="relative flex items-center justify-center w-12 h-12 mb-4">
        <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
      </div>
      <div className="text-zinc-400 text-sm font-medium tracking-wide">{text}</div>
    </div>
  );
}

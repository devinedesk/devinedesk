import { AlertTriangle } from 'lucide-react';

export function ErrorState({
  icon: Icon = AlertTriangle,
  title = 'Something went wrong',
  description = 'An unexpected error occurred while loading this section.',
  error,
  reset,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-red-500/20 rounded-2xl bg-red-500/5">
      <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
        <Icon className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-neutral-secondary max-w-sm mb-4">{error?.message || description}</p>
      {reset && (
        <button
          onClick={reset}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-full transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

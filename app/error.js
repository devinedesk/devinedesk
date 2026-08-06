"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center text-white">
      <div className="bg-panel-bg p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center text-3xl border border-red-500/30">
          ⚠️
        </div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-sm text-white/60">
          An unexpected error occurred in the application. We&apos;ve logged the issue.
        </p>
        <Button onClick={() => reset()} className="mt-2" size="lg">
          Try again
        </Button>
      </div>
    </div>
  );
}

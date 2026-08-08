'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error('Dashboard caught an error:', error);
  }, [error]);

  return (
    <div className="h-full min-h-[500px] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <Card className="max-w-lg w-full p-8 border-red-900/50 bg-red-950/20 backdrop-blur-md text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-500/30">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Dashboard Error</h2>
        <p className="text-neutral-secondary mb-6">
          We encountered an issue loading this section of the dashboard. This might be a temporary
          connectivity issue.
        </p>

        <div className="bg-black/40 border border-neutral-border-glass rounded-lg p-4 mb-8 text-left">
          <p className="text-xs font-mono text-red-300 break-words">
            {error.message || 'Unknown error occurred'}
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-red-900/20"
        >
          <RefreshCw className="h-4 w-4" />
          Reload Component
        </button>
      </Card>
    </div>
  );
}

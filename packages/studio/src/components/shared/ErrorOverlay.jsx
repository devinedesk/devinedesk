import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function ErrorOverlay({ 
  message = "Something went wrong.", 
  onRetry = null,
  retryText = "Try Again"
}) {
  return (
    <div className="absolute inset-0 bg-red-950/40 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-2xl border border-red-500/20 shadow-2xl">
      <AlertTriangle className="w-12 h-12 text-red-400 mb-6" />
      <h3 className="text-xl font-bold text-white mb-2 text-center max-w-md px-4">{message}</h3>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-6 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-full transition-all shadow-lg hover:shadow-red-500/20"
        >
          {retryText}
        </button>
      )}
    </div>
  );
}

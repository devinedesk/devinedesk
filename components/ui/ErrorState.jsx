import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export function ErrorState({
  code = '500',
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again later.',
  showHome = true,
  onRetry = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative">
        <h1 className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-b from-neutral-800 to-black select-none tracking-tighter">
          {code}
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 backdrop-blur-md">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mt-4">{title}</h2>
      <p className="text-neutral-secondary max-w-md mt-2 mb-8">{message}</p>

      <div className="flex gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors border border-neutral-700"
          >
            <RefreshCw size={18} /> Try Again
          </button>
        )}
        {showHome && (
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-black font-bold transition-colors shadow-lg shadow-primary/20"
          >
            <Home size={18} /> Return Home
          </Link>
        )}
      </div>
    </div>
  );
}

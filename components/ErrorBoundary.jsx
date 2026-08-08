'use client';

import { AlertCircle } from 'lucide-react';
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-neutral-secondary max-w-md mx-auto mb-6">
            An unexpected error occurred in this component. Our team has been notified.
          </p>
          <div className="bg-black/50 p-4 rounded-xl text-left border border-red-500/20 max-w-2xl w-full overflow-auto mb-6">
            <pre className="text-xs text-red-400 font-mono">{this.state.error?.toString()}</pre>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl px-6 py-2.5 transition-colors border border-white/10"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';
import * as Sentry from '@sentry/nextjs';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <ErrorState
        code="500"
        title="Application Error"
        message="A component failed to render properly. You can try refreshing the page."
        onRetry={reset}
        showHome={true}
      />
    </div>
  );
}

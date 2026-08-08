'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white min-h-screen font-sans flex items-center justify-center p-4">
        <ErrorState
          code="500"
          title="Internal Server Error"
          message="A critical error occurred while rendering this page. Our engineers have been notified."
          onRetry={reset}
          showHome={true}
        />
      </body>
    </html>
  );
}

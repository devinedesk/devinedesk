'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/states/ErrorState';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Section Error Boundary caught:', error);
  }, [error]);

  return <ErrorState error={error} reset={reset} />;
}

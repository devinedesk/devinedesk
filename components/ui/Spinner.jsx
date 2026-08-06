import React from 'react';
import { cn } from '@/src/lib/utils';

export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className={cn("inline-block animate-spin rounded-full border-solid border-primary border-r-transparent", sizeClass, className)} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
}

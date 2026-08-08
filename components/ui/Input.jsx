import React, { forwardRef } from 'react';
import { cn } from '@/src/lib/utils';

export const Input = forwardRef(
  ({ className = '', label, error, helperText, id, fullWidth = true, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const baseStyles =
      'flex w-full rounded-xl border bg-card-bg px-4 py-2.5 text-sm ring-offset-app-bg file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors';
    const stateStyles = error
      ? 'border-red-500 focus-visible:ring-red-500'
      : 'border-muted hover:border-secondary';
    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <div className={cn('flex flex-col gap-1.5', widthStyles)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-secondary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(baseStyles, stateStyles, className)}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {helperText && !error && <p className="text-sm text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function DatePicker({ value, onChange, placeholder = 'Select date', className }) {
  return (
    <div className={cn('relative w-full', className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Calendar className="h-4 w-4 text-neutral-secondary" />
      </div>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border border-neutral-border-glass bg-black/40 pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500',
          !value && 'text-neutral-secondary'
        )}
      />
    </div>
  );
}

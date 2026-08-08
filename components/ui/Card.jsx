import React from 'react';
import { cn } from '@/src/lib/utils';

export function Card({ children, className = '', padding = 'md', hover = false, ...props }) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const baseStyles =
    'bg-white/[0.03] backdrop-blur-[12px] border border-white/[0.08] rounded-xl overflow-hidden';
  const hoverStyles = hover ? 'transition-all hover:border-secondary hover:shadow-lg' : '';
  const paddingStyles = paddings[padding] || paddings.md;

  return (
    <div className={cn(baseStyles, hoverStyles, paddingStyles, className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3
      className={cn('text-xl font-semibold leading-none tracking-tight text-white', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={cn('text-sm text-secondary', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={cn('p-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={cn('flex items-center mt-4', className)} {...props}>
      {children}
    </div>
  );
}

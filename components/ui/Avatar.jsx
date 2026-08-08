import React from 'react';
import clsx from 'clsx';

export function Avatar({ src, alt, fallback, size = 'md', className }) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-24 w-24 text-2xl',
  };

  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden border border-neutral-border-glass bg-neutral-muted uppercase font-medium',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white">{fallback?.substring(0, 2) || '?'}</span>
      )}
    </div>
  );
}

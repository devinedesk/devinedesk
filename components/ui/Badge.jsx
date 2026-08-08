import React from 'react';
import clsx from 'clsx';

export function Badge({ children, variant = 'default', className }) {
  const variantClasses = {
    default: 'bg-white/10 text-white border-white/10',
    primary: 'bg-primary/20 text-primary border-primary/20',
    success: 'bg-green-500/20 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
    danger: 'bg-red-500/20 text-red-400 border-red-500/20',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

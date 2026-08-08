import React from 'react';
import clsx from 'clsx';

export function Table({ children, className }) {
  return (
    <div
      className={clsx(
        'w-full overflow-x-auto rounded-xl border border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md',
        className
      )}
    >
      <table className="w-full text-left border-collapse text-sm">{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }) {
  return (
    <thead className={clsx('border-b border-neutral-border-glass bg-white/5', className)}>
      {children}
    </thead>
  );
}

export function TableRow({ children, className, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={clsx(
        'border-b border-neutral-border-glass last:border-0 transition-colors',
        onClick && 'cursor-pointer hover:bg-white/5',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }) {
  return (
    <th
      className={clsx(
        'p-4 font-medium text-neutral-secondary uppercase tracking-wider text-xs',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableBody({ children, className }) {
  return (
    <tbody className={clsx('divide-y divide-neutral-border-glass text-white', className)}>
      {children}
    </tbody>
  );
}

export function TableCell({ children, className }) {
  return <td className={clsx('p-4', className)}>{children}</td>;
}

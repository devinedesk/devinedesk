import React from 'react';
import clsx from 'clsx';

export function Timeline({ items = [], className }) {
  if (items.length === 0) return null;
  return (
    <div className={clsx('space-y-4', className)}>
      {items.map((item, idx) => (
        <div key={idx} className="relative pl-8 pb-4">
          {idx !== items.length - 1 && (
            <div className="absolute top-2 left-3 w-px h-full bg-neutral-border-glass" />
          )}
          <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-neutral-card-bg border border-neutral-border-glass flex items-center justify-center">
            {item.icon ? (
              <item.icon className="h-3 w-3 text-primary" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{item.title}</p>
            {item.description && (
              <p className="text-xs text-neutral-secondary mt-1">{item.description}</p>
            )}
            <p className="text-xs text-neutral-500 mt-2">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

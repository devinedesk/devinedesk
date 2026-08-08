import React from 'react';
import { Check, Clock, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const statusConfig = {
  success: { icon: Check, color: 'text-green-500', bg: 'bg-green-500/10' },
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  error: { icon: X, color: 'text-red-500', bg: 'bg-red-500/10' },
  info: { icon: AlertCircle, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
};

export function ActivityFeed({ items = [] }) {
  if (!items.length) {
    return (
      <div className="p-8 text-center border border-dashed border-neutral-border-glass rounded-xl text-neutral-secondary">
        No activity to display.
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-border-glass before:to-transparent">
      {items.map((item, index) => {
        const config = statusConfig[item.status || 'info'];
        const Icon = config.icon;

        return (
          <div
            key={item.id || index}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            {/* Icon Marker */}
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border border-neutral-border-glass shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10',
                config.bg,
                config.color
              )}
            >
              <Icon size={18} />
            </div>

            {/* Content Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-neutral-border-glass bg-neutral-card-bg shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                <time className="text-xs text-neutral-secondary font-mono">{item.timestamp}</time>
              </div>
              <p className="text-sm text-neutral-secondary leading-relaxed">{item.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

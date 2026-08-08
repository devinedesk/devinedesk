import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function StatCard({ title, value, trend, trendValue, icon: Icon, className }) {
  const isPositive = trend === 'up';
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        'p-6 rounded-2xl border border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-sm shadow-sm relative overflow-hidden group',
        className
      )}
    >
      {/* Glow Effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <h3 className="text-sm font-medium text-neutral-secondary mb-1">{title}</h3>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className="p-3 bg-white/5 border border-neutral-border-glass rounded-xl text-neutral-400 group-hover:text-cyan-500 group-hover:border-cyan-500/30 transition-all">
            <Icon size={20} />
          </div>
        )}
      </div>

      {trendValue && (
        <div className="mt-4 flex items-center gap-2 relative z-10">
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md',
              isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            )}
          >
            <TrendIcon size={14} />
            <span>{trendValue}</span>
          </div>
          <span className="text-xs text-neutral-secondary">vs last month</span>
        </div>
      )}
    </div>
  );
}

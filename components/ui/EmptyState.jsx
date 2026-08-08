import React from 'react';
import { FolderX, Plus } from 'lucide-react';
import Link from 'next/link';

export function EmptyState({
  icon: Icon = FolderX,
  title = 'No data available',
  description = 'Get started by creating your first item.',
  actionLabel,
  actionHref,
  actionOnClick,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-neutral-border-glass rounded-2xl bg-black/20 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="h-16 w-16 bg-neutral-800/50 rounded-full flex items-center justify-center mb-4 border border-neutral-700">
        <Icon className="h-8 w-8 text-neutral-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-neutral-secondary max-w-sm mb-6">{description}</p>

      {actionLabel &&
        (actionHref || actionOnClick) &&
        (actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={actionOnClick}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            {actionLabel}
          </button>
        ))}
    </div>
  );
}

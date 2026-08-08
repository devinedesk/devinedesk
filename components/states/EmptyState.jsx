import { FileQuestion } from 'lucide-react';

export function EmptyState({
  icon: Icon = FileQuestion,
  title = 'No data found',
  description = 'Get started by creating a new item.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-neutral-border-glass rounded-2xl bg-neutral-card-bg/20">
      <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-neutral-border-glass">
        <Icon className="h-8 w-8 text-neutral-secondary" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-neutral-secondary max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

import { FileQuestion } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = FileQuestion,
  title = 'No Data Found',
  description = 'There is nothing here yet.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/10 rounded-2xl bg-neutral-card-bg/30">
      <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-neutral-400">
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="text-neutral-400 mt-1 max-w-sm mb-6">{description}</p>

      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

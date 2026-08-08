import React from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { EmptyState } from '@/components/ui/EmptyState';
import { Activity } from 'lucide-react';

export function RecentActivityList({ activities = [] }) {
  if (!activities || activities.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No Recent Activity"
        description="There is no system activity recorded yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div
          key={activity.id || index}
          className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-default"
        >
          <div className="flex items-center gap-3">
            <Avatar
              src={activity.user?.image}
              fallback={activity.user?.name?.substring(0, 2) || 'U'}
              className="h-10 w-10 border border-neutral-border-glass"
            />
            <div>
              <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                {activity.user?.name || 'Unknown User'}
              </p>
              <p className="text-xs text-neutral-secondary">{activity.actionDescription}</p>
            </div>
          </div>
          <div className="text-xs text-neutral-500 font-mono">
            {activity.createdAt
              ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
              : 'Just now'}
          </div>
        </div>
      ))}
    </div>
  );
}

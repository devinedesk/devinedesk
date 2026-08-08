import React from 'react';
import { EmptyState } from '../EmptyState';
import { Activity } from 'lucide-react';

export function NoActivity(props) {
  return (
    <EmptyState
      icon={Activity}
      title="No Recent Activity"
      description="It's quiet here. Generate an image, run a workflow, or invite a team member to see activity."
      actionLabel="Start Building"
      {...props}
    />
  );
}

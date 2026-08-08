import React from 'react';
import { EmptyState } from '../EmptyState';
import { Users } from 'lucide-react';

export function NoTeam(props) {
  return (
    <EmptyState
      icon={Users}
      title="No Team Members"
      description="You haven't invited anyone to your workspace yet. Collaborate by inviting your team."
      actionLabel="Invite Member"
      {...props}
    />
  );
}

import React from 'react';
import { EmptyState } from '../EmptyState';
import { CreditCard } from 'lucide-react';

export function NoBilling(props) {
  return (
    <EmptyState
      icon={CreditCard}
      title="No Payment Method"
      description="Add a payment method to unlock premium features and increase your API limits."
      actionLabel="Add Card"
      {...props}
    />
  );
}

import React from 'react';
import { EmptyState } from '../EmptyState';
import { SearchX } from 'lucide-react';

export function NoResults({ query, ...props }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No Results Found"
      description={
        query
          ? `We couldn't find anything matching "${query}". Try adjusting your filters.`
          : "Your search didn't match any records."
      }
      {...props}
    />
  );
}

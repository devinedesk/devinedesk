import React from 'react';
import clsx from 'clsx';

export function Skeleton({ className, ...props }) {
  return <div className={clsx('animate-pulse rounded-md bg-white/5', className)} {...props} />;
}

'use client';

import React, { useEffect, useRef } from 'react';
import { Spinner } from './Spinner';

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  next,
  loader = <div className="flex justify-center p-4"><Spinner /></div>,
  endMessage = <div className="text-center p-4 text-gray-500">No more data to load.</div>,
}) {
  const observerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          next();
        }
      },
      { rootMargin: '100px' }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, isLoading, next]);

  return (
    <div>
      {children}
      {isLoading && loader}
      {!isLoading && hasMore && <div ref={observerRef} style={{ height: '1px' }} />}
      {!hasMore && endMessage}
    </div>
  );
}

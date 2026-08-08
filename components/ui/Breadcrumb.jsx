import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Breadcrumb({ items, className }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex', className)}>
      <ol className="flex items-center space-x-2 text-sm text-neutral-secondary">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {isLast ? (
                <span className="font-medium text-white" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link href={item.href} className="hover:text-cyan-400 transition-colors">
                    {item.label}
                  </Link>
                  <ChevronRight className="mx-2 h-4 w-4 text-neutral-muted" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

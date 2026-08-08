"use client";
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Accordion({ items, className }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="border border-white/5 rounded-lg overflow-hidden bg-neutral-card-bg transition-all"
          >
            <button
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between px-4 py-4 text-left font-medium text-white transition-colors hover:bg-white/[0.02]"
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-neutral-secondary transition-transform duration-200',
                  isOpen && 'rotate-180 text-cyan-400'
                )}
              />
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="px-4 pb-4 pt-0 text-sm text-neutral-secondary">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

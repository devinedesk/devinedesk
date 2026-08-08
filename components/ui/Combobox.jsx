'use client';

import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Combobox({ options = [], value, onChange, placeholder = 'Select option...' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border border-neutral-border-glass bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
        onClick={() => setOpen(!open)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronsUpDown className="h-4 w-4 text-neutral-secondary" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-neutral-border-glass bg-neutral-card-bg shadow-lg backdrop-blur-xl">
          <div className="p-2 border-b border-neutral-border-glass">
            <input
              type="text"
              className="w-full bg-transparent text-sm text-white focus:outline-none px-2"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-center text-sm text-neutral-secondary">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-white hover:bg-white/10 transition-colors',
                    value === option.value && 'bg-white/5'
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  {option.label}
                  {value === option.value && <Check className="h-4 w-4 text-cyan-500" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

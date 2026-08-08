'use client';

import React, { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select options...',
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeValue = (optionValue, e) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div className="relative w-full">
      <div
        className="flex w-full min-h-[42px] items-center justify-between rounded-lg border border-neutral-border-glass bg-black/40 px-3 py-1.5 text-sm focus-within:ring-1 focus-within:ring-cyan-500 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {value.length === 0 ? (
            <span className="text-neutral-secondary py-1">{placeholder}</span>
          ) : (
            value.map((v) => {
              const opt = options.find((o) => o.value === v);
              if (!opt) return null;
              return (
                <span
                  key={v}
                  className="flex items-center gap-1 bg-white/10 text-white px-2 py-0.5 rounded-md text-xs"
                >
                  {opt.label}
                  <X
                    className="h-3 w-3 hover:text-red-400 cursor-pointer"
                    onClick={(e) => removeValue(v, e)}
                  />
                </span>
              );
            })
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 text-neutral-secondary ml-2 shrink-0" />
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-neutral-border-glass bg-neutral-card-bg shadow-lg backdrop-blur-xl">
          <div className="p-2 border-b border-neutral-border-glass">
            <input
              type="text"
              className="w-full bg-transparent text-sm text-white focus:outline-none px-2"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-center text-sm text-neutral-secondary">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-white hover:bg-white/10 transition-colors',
                      isSelected && 'bg-white/5'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option.value);
                    }}
                  >
                    {option.label}
                    {isSelected && <Check className="h-4 w-4 text-cyan-500" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

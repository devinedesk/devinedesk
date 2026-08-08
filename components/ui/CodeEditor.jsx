'use client';

import React, { useState, useRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function CodeEditor({
  value,
  onChange,
  language = 'json',
  placeholder = 'Write your code here...',
  className,
  readOnly = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);

      // Move cursor right after the inserted spaces
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden border bg-[#1E1E1E] transition-colors',
        isFocused
          ? 'border-cyan-500 shadow-[0_0_0_1px_rgba(6,182,212,0.5)]'
          : 'border-neutral-border-glass',
        className
      )}
    >
      <div className="flex items-center px-4 py-2 bg-[#2D2D2D] border-b border-neutral-border-glass text-xs font-mono text-neutral-400">
        <span className="uppercase tracking-wider">{language}</span>
      </div>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck={false}
          className="w-full h-full min-h-[200px] p-4 bg-transparent text-[#D4D4D4] font-mono text-sm leading-relaxed resize-y focus:outline-none focus:ring-0"
        />
      </div>
    </div>
  );
}

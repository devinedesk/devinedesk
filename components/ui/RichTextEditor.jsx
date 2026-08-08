'use client';

import React from 'react';
import { Bold, Italic, List, Link as LinkIcon, Image as ImageIcon, Code, Type } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function RichTextEditor({ value, onChange, placeholder = 'Type here...' }) {
  // A simplified placeholder RichTextEditor component to avoid massive dependencies like TipTap or Slate.
  // In a real scenario, this would wrap a robust WYSIWYG editor.

  const handleCommand = (command) => {
    document.execCommand(command, false, null);
  };

  const ToolbarButton = ({ icon: Icon, command, title }) => (
    <button
      type="button"
      onClick={() => handleCommand(command)}
      title={title}
      className="p-2 text-neutral-secondary hover:text-white hover:bg-white/10 rounded transition-colors"
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="w-full border border-neutral-border-glass rounded-xl overflow-hidden bg-neutral-card-bg focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all">
      <div className="flex items-center gap-1 p-2 border-b border-neutral-border-glass bg-white/5 flex-wrap">
        <ToolbarButton icon={Bold} command="bold" title="Bold" />
        <ToolbarButton icon={Italic} command="italic" title="Italic" />
        <div className="w-px h-5 bg-neutral-border-glass mx-1" />
        <ToolbarButton icon={List} command="insertUnorderedList" title="Bullet List" />
        <ToolbarButton icon={Type} command="formatBlock" title="Heading" />
        <div className="w-px h-5 bg-neutral-border-glass mx-1" />
        <ToolbarButton icon={Code} command="formatBlock" title="Code Block" />
        <ToolbarButton icon={LinkIcon} command="createLink" title="Insert Link" />
        <ToolbarButton icon={ImageIcon} command="insertImage" title="Insert Image" />
      </div>

      <div
        contentEditable
        className="w-full min-h-[200px] p-4 text-white text-sm outline-none overflow-y-auto prose prose-invert max-w-none"
        onInput={(e) => onChange?.(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        placeholder={placeholder}
      />
    </div>
  );
}
